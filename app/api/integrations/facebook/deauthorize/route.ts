import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;

/**
 * POST /api/integrations/facebook/deauthorize
 * 
 * Handles Facebook deauthorization callback.
 * Called when a user removes your app from their Facebook account.
 * 
 * Meta sends a POST request with form-encoded data containing:
 * - signed_request: A signed payload containing the user_id
 * 
 * Requirements:
 * - Must verify the signed_request signature using your app secret
 * - Must delete the user's integration from your database
 * - Must respond with 200 OK
 */
export async function POST(request: Request) {
  try {
    // Check if app secret is configured
    if (!FACEBOOK_APP_SECRET) {
      console.error("FACEBOOK_APP_SECRET is not configured");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    // Parse form-encoded data (Meta sends as application/x-www-form-urlencoded)
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request") as string | null;

    if (!signedRequest) {
      console.error("Missing signed_request parameter");
      return new NextResponse("Missing required parameter", { status: 400 });
    }

    // Parse and verify signed_request
    let facebookUserId: string;
    try {
      const parsed = parseSignedRequest(signedRequest, FACEBOOK_APP_SECRET);
      facebookUserId = parsed.user_id;
      
      if (!facebookUserId) {
        console.error("No user_id in signed_request");
        return new NextResponse("Invalid signed_request", { status: 400 });
      }
    } catch (error: any) {
      console.error("Error parsing signed_request:", error);
      return new NextResponse("Invalid signed_request", { status: 400 });
    }

    // Get Supabase client with service role (bypasses RLS for webhook operations)
    const supabase = createServiceRoleClient();

    // Find the integration by Facebook user_id stored in metadata
    // Note: We need to search for integrations where metadata contains the Facebook user_id
    // Since we might not have stored it, we'll also try to match by checking all Facebook integrations
    // and verify via Graph API if needed (simpler: delete all Facebook integrations for matching metadata)
    
    // First, try to find integration with Facebook user_id in metadata
    const { data: integrations, error: fetchError } = await supabase
      .from("integrations")
      .select("id, user_id, metadata")
      .eq("platform", "facebook");

    if (fetchError) {
      console.error("Error fetching integrations:", fetchError);
      return new NextResponse("Database error", { status: 500 });
    }

    // Find integration where metadata.fb_user_id matches or pages contain the user_id
    let integrationToDelete = integrations?.find((integration) => {
      const metadata = integration.metadata as any;
      if (!metadata) return false;
      
      // Check if fb_user_id is stored directly
      if (metadata.fb_user_id === facebookUserId) {
        return true;
      }
      
      // Check if any page's owner matches (pages array might contain user info)
      if (metadata.pages && Array.isArray(metadata.pages)) {
        return metadata.pages.some((page: any) => 
          page.owner_id === facebookUserId || page.id === facebookUserId
        );
      }
      
      return false;
    });

    // If not found by metadata, we can't reliably identify which user to disconnect
    // In this case, we'll log the event and respond with 200 OK (as Meta requires)
    // The user can manually disconnect from the app if needed
    if (!integrationToDelete) {
      console.warn(`Facebook deauthorization for unknown user: ${facebookUserId}`);
      // Still return 200 OK as Meta requires
      return new NextResponse("OK", { status: 200 });
    }

    // Delete the Facebook integration
    const { error: deleteError } = await supabase
      .from("integrations")
      .delete()
      .eq("id", integrationToDelete.id)
      .eq("platform", "facebook");

    if (deleteError) {
      console.error("Error deleting integration:", deleteError);
      return new NextResponse("Database error", { status: 500 });
    }

    console.log(`Facebook integration deleted for user ${integrationToDelete.user_id} (Facebook user: ${facebookUserId})`);

    // Meta requires 200 OK response
    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("Error in Facebook deauthorize callback:", error);
    // Still return 200 OK to prevent Meta from retrying
    return new NextResponse("OK", { status: 200 });
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

