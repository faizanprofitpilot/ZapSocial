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

    const { input } = await request.json();

    if (!input) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    // Check usage limits
    const { data: userData } = await supabase
      .from("users")
      .select("subscription_tier, generations_this_month")
      .eq("id", user.id)
      .single();

    if (userData?.subscription_tier === "free" && (userData?.generations_this_month || 0) >= 3) {
      return NextResponse.json(
        { error: "Monthly limit reached. Upgrade to continue." },
        { status: 403 }
      );
    }

    const prompt = `Generate 3 social media captions based on this input: "${input}"

Create captions for:
1. Facebook style (engaging, conversational, up to 500 chars)
2. LinkedIn style (professional, value-focused)
3. Instagram style (visual, engaging with emojis)

Format as:
FACEBOOK: [caption]
LINKEDIN: [caption]
INSTAGRAM: [caption]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert social media copywriter.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content || "";
    const facebookMatch = content.match(/FACEBOOK:\s*([\s\S]+?)(?=LINKEDIN|$)/i);
    const linkedinMatch = content.match(/LINKEDIN:\s*([\s\S]+?)(?=INSTAGRAM|$)/i);
    const instagramMatch = content.match(/INSTAGRAM:\s*([\s\S]+)/i);

    const captions = {
      facebook: facebookMatch ? facebookMatch[1].trim() : "",
      linkedin: linkedinMatch ? linkedinMatch[1].trim() : "",
      instagram: instagramMatch ? instagramMatch[1].trim() : "",
    };

    // OPTIMIZATION: Batch insert all posts in a single query instead of individual inserts
    const platforms = [
      { id: "facebook", caption: captions.facebook },
      { id: "linkedin", caption: captions.linkedin },
      { id: "instagram", caption: captions.instagram },
    ];

    // Prepare all posts for batch insert
    const postsToInsert = platforms
      .filter(platform => platform.caption) // Only include platforms with captions
      .map(platform => {
        // Extract hashtags from caption
        const hashtagMatches = platform.caption.match(/#\w+/g);
        const hashtags = hashtagMatches
          ? hashtagMatches.map((h) => h.replace("#", "")).slice(0, 10)
          : [];

        return {
          user_id: user.id,
          caption: platform.caption,
          hashtags,
          platform: platform.id,
          status: "draft" as const,
        };
      });

    // Batch insert all posts in a single query
    let postIds: string[] = [];
    if (postsToInsert.length > 0) {
      const { data: posts, error: insertError } = await supabase
        .from("posts")
        .insert(postsToInsert)
        .select("id");

      if (insertError) {
        console.error("Error batch inserting posts:", insertError);
        // Fallback: try individual inserts if batch fails
        for (const platform of platforms) {
          if (!platform.caption) continue;
          const hashtagMatches = platform.caption.match(/#\w+/g);
          const hashtags = hashtagMatches
            ? hashtagMatches.map((h) => h.replace("#", "")).slice(0, 10)
            : [];

          const { data: post, error } = await supabase
            .from("posts")
            .insert({
              user_id: user.id,
              caption: platform.caption,
              hashtags,
              platform: platform.id,
              status: "draft",
            })
            .select()
            .single();

          if (!error && post) {
            postIds.push(post.id);
          }
        }
      } else {
        postIds = (posts || []).map(p => p.id);
      }
    }

    // Update usage count
    await supabase
      .from("users")
      .update({ generations_this_month: (userData?.generations_this_month || 0) + 1 })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      postIds,
      count: postIds.length,
      message: `Generated ${postIds.length} captions`,
    });
  } catch (error: any) {
    console.error("Error generating captions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate captions" },
      { status: 500 }
    );
  }
}
