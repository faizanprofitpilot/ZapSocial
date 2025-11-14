import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * DELETE /api/integrations/disconnect
 * Disconnects a platform integration
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    // Delete the integration
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", platform);

    if (error) {
      console.error("Error disconnecting integration:", error);
      return NextResponse.json(
        { error: "Failed to disconnect integration" },
        { status: 500 }
      );
    }

    // TODO: Optionally revoke the token with the platform (Facebook, etc.)
    // For Facebook, you could call: https://graph.facebook.com/{user-id}/permissions?access_token={access-token}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in disconnect route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
