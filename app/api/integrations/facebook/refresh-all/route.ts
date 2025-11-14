import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;

/**
 * POST /api/integrations/facebook/refresh-all
 * Refreshes all Facebook tokens that are about to expire
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

    // Find all Facebook integrations that expire within the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: integrations, error: fetchError } = await supabase
      .from("integrations")
      .select("*")
      .eq("platform", "facebook")
      .not("token", "is", null)
      .lte("expires_at", sevenDaysFromNow.toISOString());

    if (fetchError) {
      console.error("Error fetching integrations:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch integrations" },
        { status: 500 }
      );
    }

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No tokens need refreshing",
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
        const refreshUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
        refreshUrl.searchParams.set("grant_type", "fb_exchange_token");
        refreshUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
        refreshUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
        refreshUrl.searchParams.set("fb_exchange_token", integration.token!);

        const refreshResponse = await fetch(refreshUrl.toString());
        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok || refreshData.error) {
          console.error(`Error refreshing token for integration ${integration.id}:`, refreshData);
          
          // Check if token is expired
          if (refreshData.error?.code === 190 || refreshData.error?.message?.includes("expired")) {
            // Mark as expired
            await supabase
              .from("integrations")
              .update({
                metadata: {
                  ...(integration.metadata as any),
                  expired: true,
                  expired_at: new Date().toISOString(),
                  auto_refresh_failed: true,
                  auto_refresh_error: refreshData.error?.message || "Token expired",
                },
              })
              .eq("id", integration.id);
          } else {
            // Mark auto-refresh as failed (but token not expired yet)
            await supabase
              .from("integrations")
              .update({
                metadata: {
                  ...(integration.metadata as any),
                  auto_refresh_failed: true,
                  auto_refresh_error: refreshData.error?.message || "Failed to refresh token",
                },
              })
              .eq("id", integration.id);
          }

          results.failed++;
          results.errors.push({
            integrationId: integration.id,
            error: refreshData.error?.message || "Failed to refresh token",
          });
          continue;
        }

        const { access_token, expires_in } = refreshData;
        const expiresAt = new Date(Date.now() + (expires_in || 5184000) * 1000);

        // Update integration
        const { error: updateError } = await supabase
          .from("integrations")
          .update({
            token: access_token,
            expires_at: expiresAt.toISOString(),
            metadata: {
              ...(integration.metadata as any),
              expired: false,
              token_refreshed_at: new Date().toISOString(),
              auto_refreshed: true,
              last_auto_refresh: new Date().toISOString(),
              auto_refresh_failed: false,
              auto_refresh_error: null,
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

        results.refreshed++;

        // Log successful refresh
        await supabase.from("meta_api_logs").insert({
          user_id: integration.user_id,
          integration_id: integration.id,
          platform: "facebook",
          endpoint: "/oauth/access_token",
          method: "POST",
          response_body: { success: true, expires_in },
          status_code: 200,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error processing integration ${integration.id}:`, error);
        results.failed++;
        results.errors.push({
          integrationId: integration.id,
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error("Error in refresh-all route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh tokens" },
      { status: 500 }
    );
  }
}

