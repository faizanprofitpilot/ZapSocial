import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logApiRequest, isTokenExpired, isRateLimitError } from "@/lib/meta/api-logger";
import { retry, isRetryableError } from "@/lib/meta/retry";

const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === "true";

/**
 * POST /api/posts/scheduled/process
 * Processes scheduled posts that are due to be published
 * 
 * This endpoint is designed to be called by a CRON job.
 * It processes posts with status "scheduled" and scheduled_at in the past.
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

    // Find all scheduled posts that are due to be published
    const now = new Date();
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now.toISOString())
      .limit(50); // Process up to 50 posts at a time

    if (fetchError) {
      console.error("Error fetching scheduled posts:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch scheduled posts" },
        { status: 500 }
      );
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled posts to process",
        processed: 0,
      });
    }

    // OPTIMIZATION: Batch fetch all required integrations to avoid N+1 queries
    // Get all unique user IDs from posts
    const userIds = [...new Set(scheduledPosts.map(p => p.user_id))];
    
    // Collect all platform types needed (map instagram to facebook for lookup)
    const allPlatforms = new Set<string>();
    scheduledPosts.forEach(post => {
      let platforms: string[] = [];
      if (Array.isArray(post.platform)) {
        platforms = post.platform;
      } else if (typeof post.platform === "string") {
        platforms = [post.platform];
      } else {
        platforms = post.engagement_data?.platforms || [];
      }
      platforms.forEach(p => {
        // Instagram uses Facebook integration
        allPlatforms.add(p === "instagram" ? "facebook" : p);
      });
    });

    // Fetch all needed integrations in ONE query
    const { data: allIntegrations, error: integrationsFetchError } = await supabase
      .from("integrations")
      .select("*")
      .in("user_id", userIds)
      .in("platform", Array.from(allPlatforms));

    if (integrationsFetchError) {
      console.error("Error fetching integrations:", integrationsFetchError);
      return NextResponse.json(
        { error: "Failed to fetch integrations" },
        { status: 500 }
      );
    }

    // Create lookup map: key = "user_id_platform", value = integration
    const integrationsMap = new Map<string, any>();
    (allIntegrations || []).forEach(integration => {
      const key = `${integration.user_id}_${integration.platform}`;
      integrationsMap.set(key, integration);
    });

    const results = {
      total: scheduledPosts.length,
      processed: 0,
      failed: 0,
      errors: [] as Array<{ postId: string; error: string }>,
    };

    // Process each scheduled post
    for (const post of scheduledPosts) {
      try {
        // Handle platform - can be string or array
        let platforms: string[] = [];
        if (Array.isArray(post.platform)) {
          platforms = post.platform;
        } else if (typeof post.platform === "string") {
          platforms = [post.platform];
        } else {
          // If platform is stored in engagement_data, use that
          platforms = post.engagement_data?.platforms || [];
        }

        // Skip if no platforms
        if (platforms.length === 0) {
          results.failed++;
          results.errors.push({
            postId: post.id,
            error: "No platforms specified",
          });
          continue;
        }

        // Handle image URLs
        const imageUrls = post.engagement_data?.imageUrls || (post.image_url ? [post.image_url] : []);

        // Process each platform
        for (const platform of platforms) {
          try {
            // Get integration from pre-fetched map (no database query needed)
            const platformKey = platform === "instagram" ? "facebook" : platform;
            const integrationKey = `${post.user_id}_${platformKey}`;
            const integrations = integrationsMap.get(integrationKey);

            if (!integrations) {
              results.errors.push({
                postId: post.id,
                error: `${platform} integration not found`,
              });
              continue;
            }

            // Check if integration is expired
            if (integrations.metadata && (integrations.metadata as any).expired) {
              results.errors.push({
                postId: post.id,
                error: `${platform} integration expired`,
              });
              continue;
            }

            if (platform === "facebook") {
              const pages = (integrations.metadata as any)?.pages || [];
              if (pages.length === 0) {
                results.errors.push({
                  postId: post.id,
                  error: "No Facebook Pages found",
                });
                continue;
              }

              const pageId = post.engagement_data?.page_id || pages[0].id;
              const selectedPage = pages.find((p: any) => p.id === pageId) || pages[0];

              if (!selectedPage) {
                results.errors.push({
                  postId: post.id,
                  error: "Selected page not found",
                });
                continue;
              }

              const pageAccessToken = selectedPage.access_token;
              const apiVersion = "v21.0";
              let postResponse;

              if (imageUrls.length > 0 && imageUrls[0]) {
                // Upload photo with caption
                const photoUrl = `https://graph.facebook.com/${apiVersion}/${selectedPage.id}/photos`;
                const photoData: Record<string, string | number | boolean> = {
                  url: imageUrls[0],
                  message: post.caption || "",
                  access_token: pageAccessToken,
                  published: true,
                };

                const photoResponse = await fetch(photoUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(photoData),
                });

                const photoResponseData = await photoResponse.json();
                if (!photoResponse.ok) {
                  if (isTokenExpired(photoResponseData.error)) {
                    await supabase
                      .from("integrations")
                      .update({
                        metadata: {
                          ...(integrations.metadata as any),
                          expired: true,
                          expired_at: new Date().toISOString(),
                        },
                      })
                      .eq("id", integrations.id);

                    throw new Error("Token expired");
                  }
                  throw new Error(photoResponseData.error?.message || "Failed to upload photo");
                }

                postResponse = {
                  id: photoResponseData.post_id || photoResponseData.id,
                  success: true,
                };
              } else {
                // Create text post
                const postUrl = `https://graph.facebook.com/${apiVersion}/${selectedPage.id}/feed`;
                const postData: Record<string, string> = {
                  message: post.caption || "",
                  access_token: pageAccessToken,
                };

                const postResponse_fetch = await fetch(postUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(postData),
                });

                const postData_response = await postResponse_fetch.json();
                if (!postResponse_fetch.ok) {
                  if (isTokenExpired(postData_response.error)) {
                    await supabase
                      .from("integrations")
                      .update({
                        metadata: {
                          ...(integrations.metadata as any),
                          expired: true,
                          expired_at: new Date().toISOString(),
                        },
                      })
                      .eq("id", integrations.id);

                    throw new Error("Token expired");
                  }
                  throw new Error(postData_response.error?.message || "Failed to create post");
                }

                postResponse = {
                  id: postData_response.id,
                  success: true,
                };
              }

              // Update post status to published
              await supabase
                .from("posts")
                .update({
                  status: "published",
                  engagement_data: {
                    ...post.engagement_data,
                    external_id: postResponse.id,
                  },
                })
                .eq("id", post.id);

              // Log API request
              await logApiRequest({
                user_id: post.user_id,
                integration_id: integrations.id,
                platform: "facebook",
                endpoint: `/${selectedPage.id}/${imageUrls.length > 0 ? "photos" : "feed"}`,
                method: "POST",
                response_body: postResponse,
                status_code: 200,
                success: true,
              });

            } else if (platform === "instagram") {
              const pages = (integrations.metadata as any)?.pages || [];
              if (pages.length === 0) {
                results.errors.push({
                  postId: post.id,
                  error: "No Facebook Pages found",
                });
                continue;
              }

              const pageId = post.engagement_data?.page_id || pages[0].id;
              const selectedPage = pages.find((p: any) => p.id === pageId) || pages[0];
              const instagramAccount = selectedPage?.instagram_account;

              if (!instagramAccount || !instagramAccount.id) {
                results.errors.push({
                  postId: post.id,
                  error: "No Instagram Business account linked",
                });
                continue;
              }

              if (imageUrls.length === 0) {
                results.errors.push({
                  postId: post.id,
                  error: "Instagram posts require at least one image",
                });
                continue;
              }

              const pageAccessToken = selectedPage.access_token;
              const igAccountId = instagramAccount.id;

              if (imageUrls.length === 1) {
                // Single image post with retry logic
                const postResponse = await retry(
                  async () => {
                    const containerUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
                    const containerData: Record<string, string | number | boolean> = {
                      image_url: imageUrls[0],
                      caption: post.caption || "",
                      access_token: pageAccessToken,
                      published: true,
                    };

                    const containerResponse = await fetch(containerUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(containerData),
                    });

                    const containerData_response = await containerResponse.json();
                    if (!containerResponse.ok) {
                      if (isTokenExpired(containerData_response.error)) {
                        await supabase
                          .from("integrations")
                          .update({
                            metadata: {
                              ...(integrations.metadata as any),
                              expired: true,
                              expired_at: new Date().toISOString(),
                            },
                          })
                          .eq("id", integrations.id);

                        throw new Error("Token expired");
                      }
                      throw new Error(containerData_response.error?.message || "Failed to create media container");
                    }

                    const creationId = containerData_response.id;

                    // Publish immediately
                    const publishUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`;
                    const publishResponse = await fetch(publishUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        creation_id: creationId,
                        access_token: pageAccessToken,
                      }),
                    });

                    const publishData = await publishResponse.json();
                    if (!publishResponse.ok) {
                      if (isTokenExpired(publishData.error)) {
                        await supabase
                          .from("integrations")
                          .update({
                            metadata: {
                              ...(integrations.metadata as any),
                              expired: true,
                              expired_at: new Date().toISOString(),
                            },
                          })
                          .eq("id", integrations.id);

                        throw new Error("Token expired");
                      }
                      throw new Error(publishData.error?.message || "Failed to publish media");
                    }

                    return {
                      id: publishData.id,
                      containerId: creationId,
                      success: true,
                    };
                  },
                  {
                    maxRetries: 3,
                    delayMs: 400,
                    shouldRetry: isRetryableError,
                  }
                );

                // Update post status to published
                await supabase
                  .from("posts")
                  .update({
                    status: "published",
                    engagement_data: {
                      ...post.engagement_data,
                      external_id: postResponse.id,
                    },
                  })
                  .eq("id", post.id);

                // Log API request
                await logApiRequest({
                  user_id: post.user_id,
                  integration_id: integrations.id,
                  platform: "instagram",
                  endpoint: `/${igAccountId}/media`,
                  method: "POST",
                  response_body: postResponse,
                  status_code: 200,
                  success: true,
                });
              } else {
                // Carousel post - similar logic as single image but with carousel creation
                // (Implementation similar to publish route)
                results.errors.push({
                  postId: post.id,
                  error: "Carousel posts not yet implemented in scheduled processor",
                });
              }
            } else if (platform === "linkedin") {
              const linkedInIntegration = integrations;

              if (!linkedInIntegration || !linkedInIntegration.token) {
                results.errors.push({
                  postId: post.id,
                  error: "LinkedIn integration not found or no access token",
                });
                continue;
              }

              const { LinkedInClient } = await import("@/lib/linkedin/client");
              const linkedInClient = new LinkedInClient(linkedInIntegration.token);

              // Get organization ID from engagement_data if available
              const organizationId = post.engagement_data?.organization_id || null;

              // Upload image if provided
              let mediaAssetId: string | undefined;
              if (imageUrls.length > 0) {
                try {
                  mediaAssetId = await linkedInClient.uploadImage(imageUrls[0], organizationId || undefined);
                } catch (uploadError: any) {
                  console.error("Error uploading image to LinkedIn:", uploadError);
                  // Continue without image if upload fails
                }
              }

              // Create post
              const postResponse = await linkedInClient.createPost({
                text: post.caption || "",
                organizationId: organizationId || undefined,
                visibility: "PUBLIC",
                media: mediaAssetId ? {
                  id: mediaAssetId,
                } : undefined,
              });

              // Update post status to published
              await supabase
                .from("posts")
                .update({
                  status: "published",
                  engagement_data: {
                    ...post.engagement_data,
                    external_id: postResponse.id,
                  },
                })
                .eq("id", post.id);

              // Log API request
              await logApiRequest({
                user_id: post.user_id,
                integration_id: linkedInIntegration.id,
                platform: "linkedin",
                endpoint: "/v2/ugcPosts",
                method: "POST",
                response_body: postResponse,
                status_code: 200,
                success: true,
              });
            }
          } catch (error: any) {
            console.error(`Error publishing scheduled post ${post.id} to ${platform}:`, error);
            // Don't fail the entire batch, just log the error
            results.errors.push({
              postId: post.id,
              error: error.message || "Unknown error",
            });
          }
        }

        results.processed++;
      } catch (error: any) {
        console.error(`Error processing scheduled post ${post.id}:`, error);
        results.failed++;
        results.errors.push({
          postId: post.id,
          error: error.message || "Unknown error",
        });
      }

      // Rate limiting: Wait 2 seconds between posts
      if (results.processed > 0 && results.processed < results.total) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error("Error in scheduled posts processor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process scheduled posts" },
      { status: 500 }
    );
  }
}
