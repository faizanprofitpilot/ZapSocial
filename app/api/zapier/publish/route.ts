import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await request.json();

    // Get post from posts table
    const { data: post } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get webhook URL
    const { data: webhook } = await supabase
      .from("zapier_webhooks")
      .select("webhook_url")
      .eq("user_id", user.id)
      .single();

    if (!webhook) {
      return NextResponse.json({ error: "Zapier webhook not configured" }, { status: 400 });
    }

    // Publish to Zapier
    const payload = {
      caption: post.caption,
      hashtags: post.hashtags || [],
      platform: post.platform,
      status: post.status,
      image_url: post.image_url,
      metadata: post.engagement_data || {},
    };

    const response = await fetch(webhook.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to send to Zapier");
    }

    // Update post status to published
    await supabase
      .from("posts")
      .update({ status: "published" })
      .eq("id", postId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error publishing to Zapier:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish" },
      { status: 500 }
    );
  }
}
