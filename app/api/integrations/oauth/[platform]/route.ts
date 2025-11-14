import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth Route Handler
 * 
 * This route handles OAuth initiation for various platforms.
 * For Facebook/Instagram, it redirects to the specific Facebook OAuth route.
 * For other platforms, it can be extended with their OAuth flows.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    // Route Facebook and Instagram to Facebook OAuth (Instagram uses Facebook OAuth)
    if (platform === "facebook" || platform === "instagram") {
      return NextResponse.redirect(
        new URL("/api/integrations/oauth/facebook", request.url)
      );
    }

    // Route LinkedIn to LinkedIn OAuth
    if (platform === "linkedin") {
      return NextResponse.redirect(
        new URL("/api/integrations/oauth/linkedin", request.url)
      );
    }

    // For other platforms, use mock OAuth for now
    // TODO: Implement OAuth flows for other platforms
    const { error } = await supabase
      .from("integrations")
      .upsert({
        user_id: user.id,
        platform,
        token: `mock_token_${platform}_${Date.now()}`,
        connected_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error saving integration:", error);
    }

    // Redirect back to integrations page
    return NextResponse.redirect(
      new URL(`/integrations?connected=${platform}`, request.url)
    );
  } catch (error: any) {
    console.error("Error in OAuth:", error);
    return NextResponse.redirect(new URL("/integrations?error=1", request.url));
  }
}

