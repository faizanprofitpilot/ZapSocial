import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/facebook/callback`
  : "http://localhost:3000/api/integrations/oauth/facebook/callback";

/**
 * GET /api/integrations/oauth/facebook/callback
 * Handles Facebook OAuth callback
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Facebook OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/integrations?error=facebook_oauth_${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_params", request.url)
      );
    }

    // Verify state (CSRF protection)
    let userId: string;
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64").toString());
      userId = decodedState.userId;
    } catch {
      return NextResponse.redirect(
        new URL("/integrations?error=invalid_state", request.url)
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    // Exchange code for access token
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    tokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "GET",
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error("Error exchanging code for token:", error);
      return NextResponse.redirect(
        new URL("/integrations?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedTokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    longLivedTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedTokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    longLivedTokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
    longLivedTokenUrl.searchParams.set("fb_exchange_token", access_token);

    const longLivedResponse = await fetch(longLivedTokenUrl.toString());
    let longLivedToken = access_token;
    let expiresAt: Date | null = null;

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json();
      longLivedToken = longLivedData.access_token;
      expiresAt = new Date(Date.now() + (longLivedData.expires_in || 5184000) * 1000); // Default 60 days
    } else {
      // If exchange fails, use short-lived token
      expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000); // Default 1 hour
    }

    // Get Facebook user ID (required for deauthorize/data deletion callbacks)
    const meUrl = new URL("https://graph.facebook.com/v21.0/me");
    meUrl.searchParams.set("access_token", longLivedToken);
    meUrl.searchParams.set("fields", "id");

    const meResponse = await fetch(meUrl.toString());
    const meData = await meResponse.json();
    const facebookUserId = meResponse.ok && !meData.error ? meData.id : null;

    if (!facebookUserId) {
      console.error("Failed to fetch Facebook user ID:", meData);
    }

    // Get user's pages (required for Instagram and page management)
    const pagesUrl = new URL("https://graph.facebook.com/v21.0/me/accounts");
    pagesUrl.searchParams.set("access_token", longLivedToken);
    pagesUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account");

    const pagesResponse = await fetch(pagesUrl.toString());
    const pagesData = await pagesResponse.json();

    // Fetch Instagram accounts for each page that has one
    const pagesWithInstagram = await Promise.all(
      (pagesData.data || []).map(async (page: any) => {
        // Check if page has Instagram Business Account linked
        // The instagram_business_account field returns an object with { id: "..." }
        const igBusinessAccount = page.instagram_business_account;
        
        if (!igBusinessAccount || !igBusinessAccount.id) {
          return { ...page, instagram_account: null };
        }

        try {
          // Get Instagram Business Account ID (can be an object with id, or just an id string)
          const igAccountId = typeof igBusinessAccount === 'string' 
            ? igBusinessAccount 
            : igBusinessAccount.id;

          // Get Instagram Business Account details
          const igAccountUrl = new URL(
            `https://graph.facebook.com/v21.0/${igAccountId}`
          );
          igAccountUrl.searchParams.set("access_token", page.access_token);
          igAccountUrl.searchParams.set("fields", "id,username,account_type");

          const igAccountResponse = await fetch(igAccountUrl.toString());
          const igAccountData = await igAccountResponse.json();

          if (igAccountResponse.ok && !igAccountData.error) {
            return {
              ...page,
              instagram_account: {
                id: igAccountData.id,
                username: igAccountData.username,
                account_type: igAccountData.account_type,
              },
            };
          } else {
            console.error(`Error fetching Instagram account for page ${page.id}:`, igAccountData.error);
          }
        } catch (error) {
          console.error(`Error fetching Instagram account for page ${page.id}:`, error);
        }

        return { ...page, instagram_account: null };
      })
    );

    // Store integration in database
    // Note: In production, you should encrypt tokens before storing
    const { data: integration, error: dbError } = await supabase
      .from("integrations")
      .upsert({
        user_id: user.id,
        platform: "facebook",
        token: longLivedToken, // TODO: Encrypt this before storing
        expires_at: expiresAt?.toISOString(),
        connected_at: new Date().toISOString(),
        // Store additional metadata as JSONB
        metadata: {
          fb_user_id: facebookUserId, // Store for deauthorize/data deletion callbacks
          pages: pagesWithInstagram,
          app_id: FACEBOOK_APP_ID,
          expired: false, // Mark as not expired on connection
        } as any,
      }, {
        onConflict: "user_id,platform",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error saving Facebook integration:", dbError);
      return NextResponse.redirect(
        new URL("/integrations?error=save_failed", request.url)
      );
    }

    // Log successful connection
    if (integration) {
      try {
        const { logApiRequest } = await import("@/lib/meta/api-logger");
        await logApiRequest({
          user_id: user.id,
          integration_id: integration.id,
          platform: "facebook",
          endpoint: "/oauth/access_token",
          method: "GET",
          response_body: { success: true, pages_count: pagesWithInstagram.length },
          status_code: 200,
          success: true,
        });
      } catch (error) {
        // Don't fail if logging fails
        console.error("Error logging OAuth connection:", error);
      }
    }

    // Redirect back to integrations page
    return NextResponse.redirect(
      new URL("/integrations?connected=facebook", request.url)
    );
  } catch (error: any) {
    console.error("Error in Facebook OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/integrations?error=callback_failed", request.url)
    );
  }
}

