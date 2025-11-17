import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://getzapsocial.xyz";

/**
 * POST /api/integrations/facebook/data-deletion
 * 
 * Handles Facebook data deletion callback (GDPR compliance).
 * Called when a user requests deletion of their data.
 * 
 * Meta sends a POST request with form-encoded data containing:
 * - signed_request: A signed payload containing the user_id
 * 
 * Requirements:
 * - Must verify the signed_request signature using your app secret
 * - Must delete all user data associated with the Facebook user_id
 * - Must respond with JSON containing a confirmation_url where the user can check deletion status
 * 
 * Note: According to GDPR, you should delete all data within 30 days.
 */
export async function POST(request: Request) {
  try {
    // Check if app secret is configured
    if (!FACEBOOK_APP_SECRET) {
      console.error("FACEBOOK_APP_SECRET is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Parse form-encoded data (Meta sends as application/x-www-form-urlencoded)
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request") as string | null;

    if (!signedRequest) {
      console.error("Missing signed_request parameter");
      return NextResponse.json(
        { error: "Missing required parameter" },
        { status: 400 }
      );
    }

    // Parse and verify signed_request
    let facebookUserId: string;
    try {
      const parsed = parseSignedRequest(signedRequest, FACEBOOK_APP_SECRET);
      facebookUserId = parsed.user_id;
      
      if (!facebookUserId) {
        console.error("No user_id in signed_request");
        return NextResponse.json(
          { error: "Invalid signed_request" },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error("Error parsing signed_request:", error);
      return NextResponse.json(
        { error: "Invalid signed_request" },
        { status: 400 }
      );
    }

    // Get Supabase client with service role (bypasses RLS for webhook operations)
    const supabase = createServiceRoleClient();

    // Find the integration by Facebook user_id stored in metadata
    const { data: integrations, error: fetchError } = await supabase
      .from("integrations")
      .select("id, user_id, metadata")
      .eq("platform", "facebook");

    if (fetchError) {
      console.error("Error fetching integrations:", fetchError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    // Find integration where metadata contains the Facebook user_id
    const integration = integrations?.find((integration) => {
      const metadata = integration.metadata as any;
      if (!metadata) return false;
      
      if (metadata.fb_user_id === facebookUserId) {
        return true;
      }
      
      if (metadata.pages && Array.isArray(metadata.pages)) {
        return metadata.pages.some((page: any) => 
          page.owner_id === facebookUserId || page.id === facebookUserId
        );
      }
      
      return false;
    });

    if (!integration) {
      console.warn(`Data deletion request for unknown Facebook user: ${facebookUserId}`);
      // Still return a confirmation URL as Meta requires
      return NextResponse.json({
        url: `${APP_URL}/settings?data_deletion=not_found`,
      });
    }

    const userId = integration.user_id;

    // Delete all user data associated with this integration
    // This includes:
    // 1. Facebook integration
    // 2. Instagram integration (if exists, as it's linked to Facebook)
    // 3. Posts published to Facebook/Instagram
    // 4. Metrics related to Facebook/Instagram posts
    
    // Note: We're only deleting Facebook/Instagram related data
    // User account and other integrations (LinkedIn) remain intact
    
    const deleteOperations = [];

    // Delete Facebook integration
    deleteOperations.push(
      supabase
        .from("integrations")
        .delete()
        .eq("id", integration.id)
    );

    // Delete Instagram integration if exists (linked to same user)
    deleteOperations.push(
      supabase
        .from("integrations")
        .delete()
        .eq("user_id", userId)
        .eq("platform", "instagram")
    );

    // Delete metrics for Facebook/Instagram posts first (before deleting posts)
    // First get post IDs, then delete metrics
    const { data: postsToDelete } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId)
      .in("platform", ["facebook", "instagram"]);

    if (postsToDelete && postsToDelete.length > 0) {
      const postIds = postsToDelete.map((p) => p.id);
      deleteOperations.push(
        supabase
          .from("metrics")
          .delete()
          .in("post_id", postIds)
      );
    }

    // Delete posts published to Facebook or Instagram
    deleteOperations.push(
      supabase
        .from("posts")
        .delete()
        .eq("user_id", userId)
        .in("platform", ["facebook", "instagram"])
    );

    // Delete scheduled posts for Facebook/Instagram
    deleteOperations.push(
      supabase
        .from("schedules")
        .delete()
        .eq("user_id", userId)
        .in("platform", ["facebook", "instagram"])
    );

    // Execute all deletions
    const results = await Promise.allSettled(deleteOperations);

    // Log any errors (but don't fail the request)
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Error in delete operation ${index}:`, result.reason);
      } else if (result.value.error) {
        console.error(`Error in delete operation ${index}:`, result.value.error);
      }
    });

    console.log(`Data deletion completed for user ${userId} (Facebook user: ${facebookUserId})`);

    // Meta requires a JSON response with a confirmation_url
    // This URL should show the user that their data has been deleted
    // You can create a status page or redirect to settings
    return NextResponse.json({
      url: `${APP_URL}/settings?data_deletion=completed&fb_user_id=${facebookUserId}`,
    });
  } catch (error: any) {
    console.error("Error in Facebook data deletion callback:", error);
    
    // Return a generic confirmation URL even on error
    // (as Meta requires a response, and we don't want to break their flow)
    return NextResponse.json({
      url: `${APP_URL}/settings?data_deletion=error`,
    });
  }
}

/**
 * Parses and verifies a Facebook signed_request
 * 
 * @param signedRequest - The signed_request string from Meta
 * @param secret - Your Facebook App Secret
 * @returns Parsed payload containing user_id and other data
 */
function parseSignedRequest(signedRequest: string, secret: string): any {
  const parts = signedRequest.split(".");
  
  if (parts.length !== 2) {
    throw new Error("Invalid signed_request format");
  }

  const [encodedSig, payload] = parts;

  // Decode the signature
  const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  // Decode the payload
  const decodedPayload = Buffer.from(
    payload.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf-8");

  // Verify the signature using HMAC-SHA256
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload.replace(/-/g, "+").replace(/_/g, "/"))
    .digest();

  // Use timing-safe comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error("Invalid signature");
  }

  // Parse and return the payload
  return JSON.parse(decodedPayload);
}

