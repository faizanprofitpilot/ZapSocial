import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, currentCaption } = await request.json();

    if (!postId || !currentCaption) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch original post
    const { data: post } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const prompt = `Improve this social media caption for ${post.platform}. Make it more engaging, compelling, and optimized for the platform.

Current caption:
${currentCaption}

Platform: ${post.platform}
Hashtags: ${post.hashtags?.join(", ") || "none"}

Return only the improved caption text. Keep the same general message but make it more engaging.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert social media copywriter who improves captions for maximum engagement.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const refinedCaption = completion.choices[0].message.content?.trim() || "";

    return NextResponse.json({ refinedCaption });
  } catch (error: any) {
    console.error("Error refining caption:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refine caption" },
      { status: 500 }
    );
  }
}
