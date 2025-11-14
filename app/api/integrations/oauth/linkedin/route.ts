import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET /api/integrations/oauth/linkedin
 * Initiates LinkedIn OAuth flow
 * 
 * Required scopes:
 * - openid: OpenID Connect
 * - profile: User profile information
 * - email: User email address
 * - w_member_social: Post as user (requires app review)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    if (!LINKEDIN_CLIENT_ID) {
      console.error("LINKEDIN_CLIENT_ID is not set");
      return NextResponse.redirect(
        new URL("/integrations?error=linkedin_not_configured", request.url)
      );
    }

    // Generate state parameter for CSRF protection
    const state = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Store state in session or database for validation in callback
    // For now, we'll pass it in the OAuth URL and validate in callback

    // LinkedIn OAuth authorization URL
    const redirectUri = `${NEXT_PUBLIC_APP_URL}/api/integrations/oauth/linkedin/callback`;
    
    // Required scopes (OpenID Connect + posting as user)
    const scopes = [
      "openid",
      "profile",
      "email",
      "w_member_social", // Post as user (requires app review)
    ].join(" ");

    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", scopes);

    // Redirect to LinkedIn OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error("Error in LinkedIn OAuth initiation:", error);
    return NextResponse.redirect(
      new URL("/integrations?error=oauth_failed", request.url)
    );
  }
}

