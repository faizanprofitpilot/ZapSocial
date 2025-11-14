import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { LinkedInClient } from "@/lib/linkedin/client";
import { logApiRequest } from "@/lib/meta/api-logger";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;

/**
 * POST /api/integrations/linkedin/refresh-token
 * Refreshes a LinkedIn access token
 * 
 * LinkedIn access tokens expire after 60 days.
 * This endpoint exchanges an existing refresh token for a new access token.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { integrationId } = body as { integrationId: string };

    if (!integrationId) {
      return NextResponse.json(
        { error: "integrationId is required" },
        { status: 400 }
      );
    }

    // Get integration
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("user_id", user.id)
      .eq("platform", "linkedin")
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // Get refresh token from metadata or database
    const refreshToken = integration.refresh_token || (integration.metadata as any)?.refresh_token;
    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found to refresh" },
        { status: 400 }
      );
    }

    // Use LinkedIn client to refresh token
    try {
      const linkedInClient = new LinkedInClient(integration.token || "");
      const refreshData = await linkedInClient.refreshToken(refreshToken);

      const { access_token, expires_in, refresh_token: newRefreshToken } = refreshData;

      // Calculate new expiration date
      const expiresAt = expires_in
        ? new Date(Date.now() + expires_in * 1000)
        : null;

      // Update integration with new token
      const { error: updateError } = await supabase
        .from("integrations")
        .update({
          token: access_token,
          refresh_token: newRefreshToken || refreshToken, // Use new refresh token if provided, otherwise keep old one
          expires_at: expiresAt?.toISOString() || null,
          metadata: {
            ...(integration.metadata as any),
            expired: false,
            token_refreshed_at: new Date().toISOString(),
            refresh_token: newRefreshToken || refreshToken,
            auto_refresh_failed: false, // Clear any previous auto-refresh failures
            auto_refresh_error: null,
          },
        })
        .eq("id", integrationId);

      if (updateError) {
        console.error("Error updating integration:", updateError);
        return NextResponse.json(
          { error: "Failed to update integration" },
          { status: 500 }
        );
      }

      // Log successful refresh
      await logApiRequest({
        user_id: user.id,
        integration_id: integrationId,
        platform: "linkedin",
        endpoint: "/oauth/v2/accessToken",
        method: "POST",
        response_body: { success: true, expires_in },
        status_code: 200,
        success: true,
      });

      return NextResponse.json({
        success: true,
        expires_at: expiresAt?.toISOString(),
        expires_in,
      });
    } catch (refreshError: any) {
      // Check if token is expired or invalid
      if (refreshError.message?.includes("expired") || refreshError.message?.includes("invalid")) {
        // Mark integration as expired
        await supabase
          .from("integrations")
          .update({
            metadata: {
              ...(integration.metadata as any),
              expired: true,
              expired_at: new Date().toISOString(),
            },
          })
          .eq("id", integrationId);

        // Log the error
        await logApiRequest({
          user_id: user.id,
          integration_id: integrationId,
          platform: "linkedin",
          endpoint: "/oauth/v2/accessToken",
          method: "POST",
          response_body: { error: refreshError.message },
          status_code: 401,
          success: false,
          error_message: "Token expired. Please reconnect your account.",
        });

        return NextResponse.json(
          { 
            error: "Token expired. Please reconnect your account.",
            expired: true 
          },
          { status: 401 }
        );
      }

      console.error("Error refreshing LinkedIn token:", refreshError);
      return NextResponse.json(
        { error: refreshError.message || "Failed to refresh token" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in LinkedIn refresh-token route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh token" },
      { status: 500 }
    );
  }
}

