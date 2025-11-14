import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET /api/integrations/oauth/linkedin/callback
 * Handles LinkedIn OAuth callback
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("LinkedIn OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/integrations?error=linkedin_${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/integrations?error=no_code", request.url)
      );
    }

    // Validate state (CSRF protection)
    // In production, store state in session/database and validate here
    if (!state || !state.startsWith(user.id)) {
      return NextResponse.redirect(
        new URL("/integrations?error=invalid_state", request.url)
      );
    }

    // Exchange authorization code for access token
    const redirectUri = `${NEXT_PUBLIC_APP_URL}/api/integrations/oauth/linkedin/callback`;
    const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";

    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Error exchanging code for token:", tokenData);
      return NextResponse.redirect(
        new URL("/integrations?error=token_exchange_failed", request.url)
      );
    }

    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = tokenData;

    // Calculate expiration date
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Get user profile using OpenID Connect
    const profileUrl = "https://api.linkedin.com/v2/userinfo";
    const profileResponse = await fetch(profileUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok || profileData.error) {
      console.error("Error fetching LinkedIn profile:", profileData);
      // Continue anyway - we can fetch profile later
    }

    // Organizations not available without rw_organization_admin scope
    // We're only using personal posting, so skip organization fetching
    const organizations: any[] = [];

    // Store integration in database
    const { data: integration, error: dbError } = await supabase
      .from("integrations")
      .upsert({
        user_id: user.id,
        platform: "linkedin",
        token: access_token,
        refresh_token: refresh_token || null,
        expires_at: expiresAt?.toISOString() || null,
        connected_at: new Date().toISOString(),
        metadata: {
          profile: profileData || null,
          organizations: organizations,
          app_id: LINKEDIN_CLIENT_ID,
          expired: false,
          refresh_token_expires_in: refresh_token_expires_in || null,
        } as any,
      }, {
        onConflict: "user_id,platform",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error saving LinkedIn integration:", dbError);
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
          platform: "linkedin",
          endpoint: "/oauth/v2/accessToken",
          method: "POST",
          response_body: { success: true },
          status_code: 200,
          success: true,
        });
      } catch (error) {
        // Don't fail if logging fails
        console.error("Error logging LinkedIn OAuth connection:", error);
      }
    }

    // Redirect back to integrations page
    return NextResponse.redirect(
      new URL("/integrations?connected=linkedin", request.url)
    );
  } catch (error: any) {
    console.error("Error in LinkedIn OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/integrations?error=callback_failed", request.url)
    );
  }
}

