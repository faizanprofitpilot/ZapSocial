import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      caption,
      platforms,
      tone,
      includeHashtags,
      includeEmojis,
      scheduledAt,
      imageUrls,
      status = "draft",
    } = body as {
      caption?: string;
      platforms?: string[];
      tone?: string;
      includeHashtags?: boolean;
      includeEmojis?: boolean;
      scheduledAt?: string;
      imageUrls?: string[];
      status?: "draft" | "scheduled";
    };

    if (!caption || !caption.trim() || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "Caption and at least one platform are required" },
        { status: 400 }
      );
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
    const inserts = platforms.map((platform) => ({
      user_id: user.id,
      caption,
      platform,
      status: status === "scheduled" && scheduledDate ? "scheduled" : "draft",
      scheduled_at: scheduledDate ? scheduledDate.toISOString() : null,
      image_url: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null,
      hashtags: includeHashtags ? [] : null,
      engagement_data: {
        tone,
        includeHashtags: Boolean(includeHashtags),
        includeEmojis: Boolean(includeEmojis),
        source: "manual",
        imageUrls: imageUrls || [],
      },
    }));

    const { data, error } = await supabase
      .from("posts")
      .insert(inserts)
      .select("id");

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, postIds: data?.map((row) => row.id) ?? [] });
  } catch (error: any) {
    console.error("Error saving manual draft:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save draft" },
      { status: 500 }
    );
  }
}
