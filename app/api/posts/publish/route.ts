import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logApiRequest, isTokenExpired, isRateLimitError } from "@/lib/meta/api-logger";
import { retry, isRetryableError } from "@/lib/meta/retry";

const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === "true";

/**
 * POST /api/posts/publish
 * Publishes a post to connected social media platforms
 * 
 * Features:
 * - API logging for all requests
 * - Token expiration handling
 * - Retry logic for Instagram carousels
 * - Rate limiting (2 seconds between posts)
 * - Instagram Business account validation
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  let integrationId: string | undefined;
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      caption,
      platforms,
      imageUrls = [],
      pageId, // Optional: specific Facebook page ID to use
      scheduledAt, // Optional: schedule for later
    } = body as {
      caption: string;
      platforms: string[];
      imageUrls?: string[];
      pageId?: string;
      scheduledAt?: string;
    };

    if (!caption || !caption.trim() || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "Caption and at least one platform are required" },
        { status: 400 }
      );
    }

    // Get user's integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id);

    if (integrationsError) {
      throw new Error("Failed to fetch integrations");
    }

    const results: Array<{
      platform: string;
      success: boolean;
      postId?: string;
      error?: string;
      debug?: any;
    }> = [];

    // Get Facebook integration (required for both Facebook and Instagram)
    const facebookIntegration = integrations?.find((i) => i.platform === "facebook");
    
    if (!facebookIntegration) {
      return NextResponse.json(
        { error: "Facebook/Meta integration not connected. Please connect your account in Settings." },
        { status: 400 }
      );
    }

    integrationId = facebookIntegration.id;

    // Check if integration is expired
    if (facebookIntegration.metadata && (facebookIntegration.metadata as any).expired) {
      return NextResponse.json(
        { 
          error: "Your Facebook/Meta connection has expired. Please reconnect your account in Settings.",
          expired: true 
        },
        { status: 401 }
      );
    }

    const pages = (facebookIntegration.metadata as any)?.pages || [];
    
    if (pages.length === 0) {
      return NextResponse.json(
        { error: "No Facebook Pages found. Please connect a Facebook Page." },
        { status: 400 }
      );
    }

    // Determine which page to use
    const selectedPage = pageId 
      ? pages.find((p: any) => p.id === pageId)
      : pages[0]; // Use first page by default

    if (!selectedPage) {
      return NextResponse.json(
        { error: "Selected page not found" },
        { status: 400 }
      );
    }

    // Rate limiting: Add delay between posts (2 seconds)
    let lastPostTime = 0;
    const rateLimitDelay = 2000; // 2 seconds

    // Process each platform
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      
      // Rate limiting: Wait if needed
      const timeSinceLastPost = Date.now() - lastPostTime;
      if (timeSinceLastPost < rateLimitDelay && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, rateLimitDelay - timeSinceLastPost));
      }

      try {
        if (platform === "facebook") {
          const platformStartTime = Date.now();
          // Use first image if available, or create text post
          const imageUrl = imageUrls.length > 0 ? imageUrls[0] : undefined;
          const scheduledTime = scheduledAt ? new Date(scheduledAt) : undefined;
          const pageAccessToken = selectedPage.access_token;

          // For Facebook, we can use the page access token directly
          // Create post using Facebook Graph API directly
          const apiVersion = "v21.0";
          let postResponse;
          let requestBody: any;
          let responseBody: any;
          let statusCode: number = 500;
          let errorMessage: string | undefined;

          try {
            if (imageUrl) {
              // Upload photo with caption
              const photoUrl = `https://graph.facebook.com/${apiVersion}/${selectedPage.id}/photos`;
              requestBody = {
                url: imageUrl,
                message: caption,
                access_token: pageAccessToken,
                published: scheduledTime ? false : true,
                ...(scheduledTime && {
                  scheduled_publish_time: Math.floor(scheduledTime.getTime() / 1000),
                }),
              };

              const photoResponse = await fetch(photoUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              });

              responseBody = await photoResponse.json();
              statusCode = photoResponse.status;

              if (!photoResponse.ok) {
                // Check for token expiration
                if (isTokenExpired(responseBody.error)) {
                  // Mark integration as expired
                  await supabase
                    .from("integrations")
                    .update({
                      metadata: {
                        ...(facebookIntegration.metadata as any),
                        expired: true,
                        expired_at: new Date().toISOString(),
                      },
                    })
                    .eq("id", integrationId);

                  throw new Error("Token expired. Please reconnect your account.");
                }

                // Check for rate limit
                if (isRateLimitError(responseBody.error)) {
                  // Wait and retry once
                  await new Promise((resolve) => setTimeout(resolve, 5000));
                  const retryResponse = await fetch(photoUrl, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                  });
                  responseBody = await retryResponse.json();
                  statusCode = retryResponse.status;
                  
                  if (!retryResponse.ok) {
                    throw new Error(responseBody.error?.message || "Failed to upload photo after retry");
                  }
                } else {
                  throw new Error(responseBody.error?.message || "Failed to upload photo");
                }
              }

              postResponse = {
                id: responseBody.post_id || responseBody.id,
                success: true,
              };
            } else {
              // Create text post
              const postUrl = `https://graph.facebook.com/${apiVersion}/${selectedPage.id}/feed`;
              requestBody = {
                message: caption,
                access_token: pageAccessToken,
                ...(scheduledTime && {
                  published: "false",
                  scheduled_publish_time: Math.floor(scheduledTime.getTime() / 1000).toString(),
                }),
              };

              const postResponse_fetch = await fetch(postUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              });

              responseBody = await postResponse_fetch.json();
              statusCode = postResponse_fetch.status;

              if (!postResponse_fetch.ok) {
                // Check for token expiration
                if (isTokenExpired(responseBody.error)) {
                  await supabase
                    .from("integrations")
                    .update({
                      metadata: {
                        ...(facebookIntegration.metadata as any),
                        expired: true,
                        expired_at: new Date().toISOString(),
                      },
                    })
                    .eq("id", integrationId);

                  throw new Error("Token expired. Please reconnect your account.");
                }

                throw new Error(responseBody.error?.message || "Failed to create post");
              }

              postResponse = {
                id: responseBody.id,
                success: true,
              };
            }

            // Log API request
            await logApiRequest({
              user_id: user.id,
              integration_id: integrationId,
              platform: "facebook",
              endpoint: imageUrl ? `/${selectedPage.id}/photos` : `/${selectedPage.id}/feed`,
              method: "POST",
              request_body: { ...requestBody, access_token: "[REDACTED]" },
              response_body: responseBody,
              status_code: statusCode,
              success: true,
              duration_ms: Date.now() - platformStartTime,
            });

            // Save to database
            const { data: post, error: dbError } = await supabase
              .from("posts")
              .insert({
                user_id: user.id,
                caption,
                platform: "facebook",
                status: scheduledTime ? "scheduled" : "published",
                scheduled_at: scheduledTime?.toISOString() || null,
                image_url: imageUrl || null,
                engagement_data: {
                  external_id: postResponse.id,
                  page_id: selectedPage.id,
                  page_name: selectedPage.name,
                },
              })
              .select()
              .single();

            if (dbError) {
              console.error("Error saving Facebook post to database:", dbError);
            }

            results.push({
              platform: "facebook",
              success: true,
              postId: postResponse.id,
              ...(DEBUG_MODE && { debug: responseBody }),
            });

            lastPostTime = Date.now();

          } catch (error: any) {
            errorMessage = error.message || "Unknown error";
            
            // Log error
            await logApiRequest({
              user_id: user.id,
              integration_id: integrationId,
              platform: "facebook",
              endpoint: imageUrl ? `/${selectedPage.id}/photos` : `/${selectedPage.id}/feed`,
              method: "POST",
              request_body: requestBody ? { ...requestBody, access_token: "[REDACTED]" } : undefined,
              response_body: responseBody,
              status_code: statusCode || 500,
              success: false,
              error_message: errorMessage,
              duration_ms: Date.now() - platformStartTime,
            });

            throw error;
          }

        } else if (platform === "instagram") {
          const platformStartTime = Date.now();
          // Check if page has Instagram account
          const instagramAccount = selectedPage.instagram_account;
          if (!instagramAccount || !instagramAccount.id) {
            results.push({
              platform: "instagram",
              success: false,
              error: "No Instagram Business account linked to this Facebook Page",
            });
            continue;
          }

          // Validate Instagram account type
          if (instagramAccount.account_type && instagramAccount.account_type !== "BUSINESS") {
            results.push({
              platform: "instagram",
              success: false,
              error: `Instagram account must be a Business account. Current type: ${instagramAccount.account_type}. Please convert your Instagram account to a Business account in Instagram Settings.`,
            });
            continue;
          }

          // Instagram requires at least one image
          if (imageUrls.length === 0) {
            results.push({
              platform: "instagram",
              success: false,
              error: "Instagram posts require at least one image",
            });
            continue;
          }

          // Validate carousel images (2-10 images)
          if (imageUrls.length > 1 && (imageUrls.length < 2 || imageUrls.length > 10)) {
            results.push({
              platform: "instagram",
              success: false,
              error: "Instagram carousels must have between 2 and 10 images",
            });
            continue;
          }

          const scheduledTime = scheduledAt ? new Date(scheduledAt) : undefined;
          const pageAccessToken = selectedPage.access_token;
          const igAccountId = instagramAccount.id;

          let postResponse;
          let requestBody: any;
          let responseBody: any;
          let statusCode: number = 500;
          let errorMessage: string | undefined;

          try {
            if (imageUrls.length === 1) {
              // Single image post with retry logic
              postResponse = await retry(
                async () => {
                  // Create media container
                  const containerUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
                  const containerData: Record<string, string | number | boolean> = {
                    image_url: imageUrls[0],
                    caption: caption,
                    access_token: pageAccessToken,
                    published: scheduledTime ? false : true,
                  };

                  if (scheduledTime) {
                    containerData.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
                  }

                  requestBody = containerData;

                  const containerResponse = await fetch(containerUrl, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(containerData),
                  });

                  responseBody = await containerResponse.json();
                  statusCode = containerResponse.status;

                  if (!containerResponse.ok) {
                    // Check for token expiration
                    if (isTokenExpired(responseBody.error)) {
                      await supabase
                        .from("integrations")
                        .update({
                          metadata: {
                            ...(facebookIntegration.metadata as any),
                            expired: true,
                            expired_at: new Date().toISOString(),
                          },
                        })
                        .eq("id", integrationId);

                      throw new Error("Token expired. Please reconnect your account.");
                    }

                    throw new Error(responseBody.error?.message || "Failed to create media container");
                  }

                  const creationId = responseBody.id;

                  // If not scheduled, publish immediately
                  if (!scheduledTime) {
                    const publishUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`;
                    const publishBody = {
                      creation_id: creationId,
                      access_token: pageAccessToken,
                    };

                    const publishResponse = await fetch(publishUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(publishBody),
                    });

                    const publishData = await publishResponse.json();
                    statusCode = publishResponse.status;

                    if (!publishResponse.ok) {
                      // Check for token expiration
                      if (isTokenExpired(publishData.error)) {
                        await supabase
                          .from("integrations")
                          .update({
                            metadata: {
                              ...(facebookIntegration.metadata as any),
                              expired: true,
                              expired_at: new Date().toISOString(),
                            },
                          })
                          .eq("id", integrationId);

                        throw new Error("Token expired. Please reconnect your account.");
                      }

                      throw new Error(publishData.error?.message || "Failed to publish media");
                    }

                    return {
                      id: publishData.id,
                      containerId: creationId,
                      success: true,
                    };
                  } else {
                    return {
                      id: creationId,
                      containerId: creationId,
                      success: true,
                    };
                  }
                },
                {
                  maxRetries: 3,
                  delayMs: 400,
                  shouldRetry: isRetryableError,
                }
              );
            } else {
              // Carousel post (multiple images) with retry logic
              postResponse = await retry(
                async () => {
                  // Create individual media containers for each image with retry
                  const children: string[] = [];
                  
                  for (const imageUrl of imageUrls) {
                    const childContainerId = await retry(
                      async () => {
                        const childContainerUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
                        const childContainerBody = {
                          image_url: imageUrl,
                          access_token: pageAccessToken,
                          published: false,
                        };

                        const childContainerResponse = await fetch(childContainerUrl, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(childContainerBody),
                        });

                        const childContainerData = await childContainerResponse.json();
                        statusCode = childContainerResponse.status;

                        if (!childContainerResponse.ok) {
                          // Check for token expiration
                          if (isTokenExpired(childContainerData.error)) {
                            await supabase
                              .from("integrations")
                              .update({
                                metadata: {
                                  ...(facebookIntegration.metadata as any),
                                  expired: true,
                                  expired_at: new Date().toISOString(),
                                },
                              })
                              .eq("id", integrationId);

                            throw new Error("Token expired. Please reconnect your account.");
                          }

                          throw new Error(childContainerData.error?.message || "Failed to create child media container");
                        }

                        return childContainerData.id;
                      },
                      {
                        maxRetries: 3,
                        delayMs: 500,
                        shouldRetry: isRetryableError,
                      }
                    );

                    children.push(childContainerId);
                  }

                  // Create carousel container
                  const carouselContainerUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
                  const carouselContainerData: Record<string, string | number | boolean> = {
                    image_url: imageUrls[0],
                    caption: caption,
                    access_token: pageAccessToken,
                    media_type: "CAROUSEL_ALBUM",
                    children: children.join(","),
                    published: scheduledTime ? false : true,
                  };

                  if (scheduledTime) {
                    carouselContainerData.scheduled_publish_time = Math.floor(scheduledTime.getTime() / 1000);
                  }

                  requestBody = carouselContainerData;

                  const carouselContainerResponse = await fetch(carouselContainerUrl, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(carouselContainerData),
                  });

                  responseBody = await carouselContainerResponse.json();
                  statusCode = carouselContainerResponse.status;

                  if (!carouselContainerResponse.ok) {
                    // Check for token expiration
                    if (isTokenExpired(responseBody.error)) {
                      await supabase
                        .from("integrations")
                        .update({
                          metadata: {
                            ...(facebookIntegration.metadata as any),
                            expired: true,
                            expired_at: new Date().toISOString(),
                          },
                        })
                        .eq("id", integrationId);

                      throw new Error("Token expired. Please reconnect your account.");
                    }

                    throw new Error(responseBody.error?.message || "Failed to create carousel container");
                  }

                  const creationId = responseBody.id;

                  // If not scheduled, publish immediately
                  if (!scheduledTime) {
                    const publishUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`;
                    const publishBody = {
                      creation_id: creationId,
                      access_token: pageAccessToken,
                    };

                    const publishResponse = await fetch(publishUrl, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(publishBody),
                    });

                    const publishData = await publishResponse.json();
                    statusCode = publishResponse.status;

                    if (!publishResponse.ok) {
                      // Check for token expiration
                      if (isTokenExpired(publishData.error)) {
                        await supabase
                          .from("integrations")
                          .update({
                            metadata: {
                              ...(facebookIntegration.metadata as any),
                              expired: true,
                              expired_at: new Date().toISOString(),
                            },
                          })
                          .eq("id", integrationId);

                        throw new Error("Token expired. Please reconnect your account.");
                      }

                      throw new Error(publishData.error?.message || "Failed to publish carousel");
                    }

                    return {
                      id: publishData.id,
                      containerId: creationId,
                      success: true,
                    };
                  } else {
                    return {
                      id: creationId,
                      containerId: creationId,
                      success: true,
                    };
                  }
                },
                {
                  maxRetries: 2,
                  delayMs: 600,
                  shouldRetry: isRetryableError,
                }
              );
            }

            // Log API request
            await logApiRequest({
              user_id: user.id,
              integration_id: integrationId,
              platform: "instagram",
              endpoint: `/${igAccountId}/media`,
              method: "POST",
              request_body: requestBody ? { ...requestBody, access_token: "[REDACTED]" } : undefined,
              response_body: responseBody,
              status_code: statusCode || 200,
              success: true,
              duration_ms: Date.now() - platformStartTime,
            });

            // Save to database
            const { data: post, error: dbError } = await supabase
              .from("posts")
              .insert({
                user_id: user.id,
                caption,
                platform: "instagram",
                status: scheduledTime ? "scheduled" : "published",
                scheduled_at: scheduledTime?.toISOString() || null,
                image_url: imageUrls[0] || null,
                engagement_data: {
                  external_id: postResponse.id,
                  page_id: selectedPage.id,
                  page_name: selectedPage.name,
                  instagram_account_id: instagramAccount.id,
                  instagram_username: instagramAccount.username,
                  account_type: instagramAccount.account_type,
                },
              })
              .select()
              .single();

            if (dbError) {
              console.error("Error saving Instagram post to database:", dbError);
            }

            results.push({
              platform: "instagram",
              success: true,
              postId: postResponse.id,
              ...(DEBUG_MODE && { debug: responseBody }),
            });

            lastPostTime = Date.now();

          } catch (error: any) {
            errorMessage = error.message || "Unknown error";
            
            // Log error
            await logApiRequest({
              user_id: user.id,
              integration_id: integrationId,
              platform: "instagram",
              endpoint: `/${igAccountId}/media`,
              method: "POST",
              request_body: requestBody ? { ...requestBody, access_token: "[REDACTED]" } : undefined,
              response_body: responseBody,
              status_code: statusCode || 500,
              success: false,
              error_message: errorMessage,
              duration_ms: Date.now() - platformStartTime,
            });

            throw error;
          }

        } else if (platform === "linkedin") {
          const platformStartTime = Date.now();
          
          // Get LinkedIn integration
          const linkedInIntegration = integrations?.find((i) => i.platform === "linkedin");
          
          if (!linkedInIntegration) {
            results.push({
              platform: "linkedin",
              success: false,
              error: "LinkedIn integration not connected. Please connect your account in Settings.",
            });
            continue;
          }

          // Check if integration is expired
          if (linkedInIntegration.metadata && (linkedInIntegration.metadata as any).expired) {
            results.push({
              platform: "linkedin",
              success: false,
              error: "Your LinkedIn connection has expired. Please reconnect your account in Settings.",
            });
            continue;
          }

          const accessToken = linkedInIntegration.token;
          if (!accessToken) {
            results.push({
              platform: "linkedin",
              success: false,
              error: "No access token found",
            });
            continue;
          }

          // Get organization ID from request body if provided (for posting as organization)
          const organizationId = (body as any).linkedInOrganizationId;
          
          let postResponse;
          let requestBody: any;
          let responseBody: any;
          let statusCode: number = 500;
          let errorMessage: string | undefined;

          try {
            const { LinkedInClient } = await import("@/lib/linkedin/client");
            const linkedInClient = new LinkedInClient(accessToken);

            // If images are provided, upload them first
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
            postResponse = await linkedInClient.createPost({
              text: caption,
              organizationId: organizationId || undefined,
              visibility: "PUBLIC",
              media: mediaAssetId ? {
                id: mediaAssetId,
              } : undefined,
            });

            // Log API request
            await logApiRequest({
              user_id: user.id,
              integration_id: linkedInIntegration.id,
              platform: "linkedin",
              endpoint: "/v2/ugcPosts",
              method: "POST",
              request_body: { ...requestBody, access_token: "[REDACTED]" },
              response_body: postResponse,
              status_code: 200,
              success: true,
              duration_ms: Date.now() - platformStartTime,
            });

            // Save to database
            const { data: post, error: dbError } = await supabase
              .from("posts")
              .insert({
                user_id: user.id,
                caption,
                platform: "linkedin",
                status: scheduledAt ? "scheduled" : "published",
                scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
                image_url: imageUrls[0] || null,
                engagement_data: {
                  external_id: postResponse.id,
                  organization_id: organizationId || null,
                },
              })
              .select()
              .single();

            if (dbError) {
              console.error("Error saving LinkedIn post to database:", dbError);
            }

            results.push({
              platform: "linkedin",
              success: true,
              postId: postResponse.id,
              ...(DEBUG_MODE && { debug: postResponse }),
            });

            lastPostTime = Date.now();

          } catch (error: any) {
            errorMessage = error.message || "Unknown error";
            
            // Check for token expiration (LinkedIn returns 401 for expired tokens)
            if (errorMessage && (errorMessage.includes("401") || errorMessage.includes("expired") || errorMessage.includes("Unauthorized"))) {
              // Mark integration as expired
              await supabase
                .from("integrations")
                .update({
                  metadata: {
                    ...(linkedInIntegration.metadata as any),
                    expired: true,
                    expired_at: new Date().toISOString(),
                  },
                })
                .eq("id", linkedInIntegration.id);

              errorMessage = "Token expired. Please reconnect your account.";
            }

            // Log error
            await logApiRequest({
              user_id: user.id,
              integration_id: linkedInIntegration.id,
              platform: "linkedin",
              endpoint: "/v2/ugcPosts",
              method: "POST",
              request_body: requestBody ? { ...requestBody, access_token: "[REDACTED]" } : undefined,
              response_body: responseBody,
              status_code: statusCode,
              success: false,
              error_message: errorMessage,
              duration_ms: Date.now() - platformStartTime,
            });

            results.push({
              platform: "linkedin",
              success: false,
              error: errorMessage,
              ...(DEBUG_MODE && { debug: error }),
            });
          }

        } else {
          // Other platforms - not implemented yet
          results.push({
            platform,
            success: false,
            error: `${platform} publishing not yet implemented`,
          });
        }
      } catch (error: any) {
        console.error(`Error publishing to ${platform}:`, error);
        results.push({
          platform,
          success: false,
          error: error.message || "Unknown error",
          ...(DEBUG_MODE && { debug: error }),
        });
      }
    }

    // Check if all posts failed
    const allFailed = results.every((r) => !r.success);
    if (allFailed) {
      return NextResponse.json(
        { 
          error: "Failed to publish to any platform",
          results,
        },
        { status: 500 }
      );
    }

    // Check if some posts failed
    const someFailed = results.some((r) => !r.success);
    if (someFailed) {
      return NextResponse.json({
        success: true,
        partial: true,
        results,
        message: "Some posts published successfully, but some failed",
      });
    }

    return NextResponse.json({
      success: true,
      results,
      message: "Posts published successfully",
      ...(DEBUG_MODE && { duration_ms: Date.now() - startTime }),
    });
  } catch (error: any) {
    console.error("Error in publish route:", error);
    
    // Log error if we have integration ID
    if (integrationId) {
      await logApiRequest({
        user_id: "unknown",
        integration_id: integrationId,
        platform: "facebook",
        endpoint: "/posts/publish",
        method: "POST",
        success: false,
        error_message: error.message || "Failed to publish posts",
        duration_ms: Date.now() - startTime,
      }).catch(() => {}); // Don't fail if logging fails
    }

    return NextResponse.json(
      { error: error.message || "Failed to publish posts" },
      { status: 500 }
    );
  }
}
