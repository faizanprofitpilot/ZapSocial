import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { webhook_url } = await request.json();

    if (!webhook_url) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
    }

    // Upsert webhook
    const { error } = await supabase
      .from("zapier_webhooks")
      .upsert({
        user_id: user.id,
        webhook_url,
      }, {
        onConflict: "user_id",
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving webhook:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save webhook" },
      { status: 500 }
    );
  }
}

