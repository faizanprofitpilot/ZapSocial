import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;

/**
 * POST /api/integrations/facebook/refresh-token
 * Refreshes a Facebook long-lived access token
 * 
 * Facebook long-lived tokens expire after 60 days.
 * This endpoint exchanges an existing long-lived token for a new one.
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
      .eq("platform", "facebook")
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // Get current token (stored in token field or metadata)
    const currentToken = integration.token;
    if (!currentToken) {
      return NextResponse.json(
        { error: "No token found to refresh" },
        { status: 400 }
      );
    }

    // Exchange token for a new long-lived token
    const refreshUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    refreshUrl.searchParams.set("grant_type", "fb_exchange_token");
    refreshUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    refreshUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
    refreshUrl.searchParams.set("fb_exchange_token", currentToken);

    const refreshResponse = await fetch(refreshUrl.toString());
    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok || refreshData.error) {
      console.error("Error refreshing token:", refreshData);
      
      // Log the error
      await supabase.from("meta_api_logs").insert({
        user_id: user.id,
        integration_id: integrationId,
        platform: "facebook",
        endpoint: "/oauth/access_token",
        method: "POST",
        response_body: refreshData,
        status_code: refreshResponse.status,
        success: false,
        error_message: refreshData.error?.message || "Failed to refresh token",
      });

      // Check if token is expired or invalid
      if (refreshData.error?.code === 190 || refreshData.error?.message?.includes("expired")) {
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

        return NextResponse.json(
          { 
            error: "Token expired. Please reconnect your account.",
            expired: true 
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: refreshData.error?.message || "Failed to refresh token" },
        { status: 500 }
      );
    }

    const { access_token, expires_in } = refreshData;

    // Calculate new expiration date
    const expiresAt = new Date(Date.now() + (expires_in || 5184000) * 1000); // Default 60 days

    // Update integration with new token
    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        token: access_token,
        expires_at: expiresAt.toISOString(),
        metadata: {
          ...(integration.metadata as any),
          expired: false,
          token_refreshed_at: new Date().toISOString(),
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
    await supabase.from("meta_api_logs").insert({
      user_id: user.id,
      integration_id: integrationId,
      platform: "facebook",
      endpoint: "/oauth/access_token",
      method: "POST",
      response_body: { success: true, expires_in },
      status_code: 200,
      success: true,
    });

    return NextResponse.json({
      success: true,
      expires_at: expiresAt.toISOString(),
      expires_in,
    });
  } catch (error: any) {
    console.error("Error in refresh-token route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh token" },
      { status: 500 }
    );
  }
}

