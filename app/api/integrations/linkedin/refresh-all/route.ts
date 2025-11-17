import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { LinkedInClient } from "@/lib/linkedin/client";
import { logApiRequest } from "@/lib/meta/api-logger";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;

/**
 * POST /api/integrations/linkedin/refresh-all
 * Refreshes all LinkedIn tokens that are about to expire
 * 
 * This endpoint is designed to be called by a CRON job.
 * It refreshes tokens that expire within the next 7 days.
 */
export async function POST(request: Request) {
  try {
    // Vercel CRON jobs are automatically authenticated by Vercel.
    // Optionally, you can add CRON_SECRET env var for extra security
    // (useful if you want to manually trigger or use external CRON services).
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabase = await createClient();

    // Find all LinkedIn integrations that expire within the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: integrations, error: fetchError } = await supabase
      .from("integrations")
      .select("*")
      .eq("platform", "linkedin")
      .not("token", "is", null)
      .lte("expires_at", sevenDaysFromNow.toISOString())
      .not("expires_at", "is", null);

    if (fetchError) {
      console.error("Error fetching LinkedIn integrations:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch integrations" },
        { status: 500 }
      );
    }

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No LinkedIn tokens need refreshing",
        refreshed: 0,
      });
    }

    const results = {
      total: integrations.length,
      refreshed: 0,
      failed: 0,
      errors: [] as Array<{ integrationId: string; error: string }>,
    };

    // Refresh each token
    for (const integration of integrations) {
      try {
        // OPTIMIZATION: Skip if token was refreshed within last 24 hours to prevent duplicate refreshes
        const metadata = integration.metadata as any;
        const lastRefresh = metadata?.token_refreshed_at || metadata?.last_auto_refresh;
        if (lastRefresh) {
          const hoursSinceRefresh = (Date.now() - new Date(lastRefresh).getTime()) / (1000 * 60 * 60);
          if (hoursSinceRefresh < 24) {
            // Skip, already refreshed recently
            results.refreshed++; // Count as successful (already refreshed)
            continue;
          }
        }

        // Get refresh token from metadata or database
        const refreshToken = integration.refresh_token || (integration.metadata as any)?.refresh_token;
        if (!refreshToken) {
          results.failed++;
          results.errors.push({
            integrationId: integration.id,
            error: "No refresh token found",
          });
          continue;
        }

        // Use LinkedIn client to refresh token
        const linkedInClient = new LinkedInClient(integration.token || "");
        const refreshData = await linkedInClient.refreshToken(refreshToken);

        const { access_token, expires_in, refresh_token: newRefreshToken } = refreshData;

        // Calculate new expiration date
        const expiresAt = expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : null;

        // Update integration
        const { error: updateError } = await supabase
          .from("integrations")
          .update({
            token: access_token,
            refresh_token: newRefreshToken || refreshToken,
            expires_at: expiresAt?.toISOString() || null,
            metadata: {
              ...(integration.metadata as any),
              expired: false,
              token_refreshed_at: new Date().toISOString(),
              refresh_token: newRefreshToken || refreshToken,
              auto_refreshed: true,
              last_auto_refresh: new Date().toISOString(),
            },
          })
          .eq("id", integration.id);

        if (updateError) {
          console.error(`Error updating integration ${integration.id}:`, updateError);
          results.failed++;
          results.errors.push({
            integrationId: integration.id,
            error: "Failed to update integration",
          });
          continue;
        }

        // Log successful refresh
        await logApiRequest({
          user_id: integration.user_id,
          integration_id: integration.id,
          platform: "linkedin",
          endpoint: "/oauth/v2/accessToken",
          method: "POST",
          response_body: { success: true, expires_in, auto_refresh: true },
          status_code: 200,
          success: true,
        });

        results.refreshed++;
      } catch (refreshError: any) {
        console.error(`Error refreshing token for integration ${integration.id}:`, refreshError);
        
        // Check if token is expired or invalid
        if (refreshError.message?.includes("expired") || refreshError.message?.includes("invalid")) {
          // Mark as expired
          await supabase
            .from("integrations")
            .update({
              metadata: {
                ...(integration.metadata as any),
                expired: true,
                expired_at: new Date().toISOString(),
                auto_refresh_failed: true,
                auto_refresh_error: refreshError.message,
              },
            })
            .eq("id", integration.id);

          // Log the error
          await logApiRequest({
            user_id: integration.user_id,
            integration_id: integration.id,
            platform: "linkedin",
            endpoint: "/oauth/v2/accessToken",
            method: "POST",
            response_body: { error: refreshError.message },
            status_code: 401,
            success: false,
            error_message: refreshError.message,
          });
        }

        results.failed++;
        results.errors.push({
          integrationId: integration.id,
          error: refreshError.message || "Failed to refresh token",
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error("Error in LinkedIn refresh-all route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh tokens" },
      { status: 500 }
    );
  }
}

