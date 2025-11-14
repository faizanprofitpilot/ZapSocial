import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Facebook OAuth Route
 * 
 * This route handles the Facebook OAuth flow:
 * 1. Redirects user to Facebook login
 * 2. Handles callback from Facebook
 * 3. Exchanges code for access token
 * 4. Stores tokens in database
 * 
 * Required permissions:
 * - pages_show_list - List user's Facebook Pages
 * - pages_read_engagement - Read page engagement metrics
 * - pages_manage_posts - Create and manage posts on Pages
 * - pages_read_user_content - Read user-generated content (for Instagram access)
 * - business_management - Manage business assets
 * - read_insights - Read page insights (optional)
 * 
 * Note: Instagram access is obtained through Facebook Pages, not direct OAuth scopes.
 * When a user connects their Facebook account, we get access to their Pages,
 * and Instagram Business accounts linked to those Pages are accessible via the Page token.
 */

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/facebook/callback`
  : "http://localhost:3000/api/integrations/oauth/facebook/callback";

/**
 * GET /api/integrations/oauth/facebook
 * Initiates Facebook OAuth flow
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    // Check if FACEBOOK_APP_ID is configured
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error("Facebook App ID or Secret not configured");
      return NextResponse.redirect(
        new URL("/integrations?error=facebook_not_configured", request.url)
      );
    }

    // Facebook OAuth scopes (valid permissions only)
    // Note: Instagram is accessed via Facebook Pages, not direct OAuth scopes
    const scopes = [
      "pages_show_list",           // List user's Pages
      "pages_read_engagement",     // Read engagement metrics
      "pages_manage_posts",        // Create and manage posts
      "pages_read_user_content",   // Read user content (needed for Instagram)
      "business_management",       // Manage business assets
      // "read_insights",          // Uncomment when you add this permission in Facebook
    ].join(",");

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64");

    // Facebook OAuth URL
    const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    authUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error("Error initiating Facebook OAuth:", error);
    return NextResponse.redirect(
      new URL("/integrations?error=oauth_init_failed", request.url)
    );
  }
}

