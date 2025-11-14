import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import { NextResponse } from "next/server";

const platformInstructions = {
  instagram: "Create an engaging Instagram post with emojis and relevant hashtags. Keep it visual and personal.",
  linkedin: "Create a professional LinkedIn post that provides value and encourages engagement. Use a professional tone.",
  x: "Create a concise X (Twitter) post. Keep it under 280 characters. Make it punchy and engaging.",
  facebook: "Create a friendly Facebook post that encourages community engagement. Use a conversational tone.",
};

const toneInstructions: Record<string, string> = {
  friendly: "Use a warm, approachable, and conversational tone. Be personable and relatable.",
  professional: "Use a formal, polished, and business-appropriate tone. Maintain authority and credibility.",
  witty: "Use clever, humorous, and cleverly worded language. Include subtle humor and wordplay.",
  playful: "Use a fun, light-hearted, and energetic tone. Be creative and use expressive language.",
  persuasive: "Use a compelling, convincing tone that drives action. Include calls-to-action and benefits.",
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      topic, 
      platforms, 
      generateImage,
      tone = "friendly",
      wordCount = 100,
      generateHashtags = true,
      includeEmojis = false,
      numPosts = 5,
    } = await request.json();

    if (!topic || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: "Topic and platforms are required" }, { status: 400 });
    }

    const posts: Array<{
      id: string;
      caption: string;
      hashtags: string[];
      platform: string;
      tone: string;
    }> = [];

    // Generate multiple posts for each platform (numPosts total across all platforms)
    const postsPerPlatform = Math.max(1, Math.floor(numPosts / platforms.length));
    const remainingPosts = numPosts % platforms.length;

    for (let pIdx = 0; pIdx < platforms.length; pIdx++) {
      const platform = platforms[pIdx];
      const countForPlatform = postsPerPlatform + (pIdx < remainingPosts ? 1 : 0);

      for (let i = 0; i < countForPlatform; i++) {
        const instruction = platformInstructions[platform as keyof typeof platformInstructions] || platformInstructions.instagram;
        const toneInstruction = toneInstructions[tone] || toneInstructions.friendly;

        let prompt = `Create a social media post for ${platform} about: "${topic}"

${instruction}

Tone: ${toneInstruction}

Requirements:
- Write an engaging caption`;
        
        if (wordCount > 0) {
          prompt += `\n- Target approximately ${wordCount} words`;
        }
        
        if (includeEmojis) {
          prompt += `\n- Include relevant emojis throughout the post`;
        } else {
          prompt += `\n- Do not use emojis unless they are essential`;
        }

        prompt += `\n- Make it appropriate for ${platform}'s audience and format`;
        
        if (generateHashtags) {
          prompt += `\n- Include 5-10 relevant hashtags at the end`;
        }

        prompt += `\n\nFormat as:
CAPTION:
[caption text]

HASHTAGS:
[hashtag list]`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert social media copywriter who creates engaging, platform-specific content.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8 + (i * 0.1), // Vary temperature slightly for diversity
          max_tokens: Math.max(300, wordCount * 2),
        });

        const content = completion.choices[0].message.content || "";
        const captionMatch = content.match(/CAPTION:\s*([\s\S]+?)(?=HASHTAGS:|$)/i);
        const hashtagsMatch = content.match(/HASHTAGS:\s*([\s\S]+)/i);

        let caption = captionMatch ? captionMatch[1].trim() : content.trim();
        let hashtags: string[] = [];
        
        if (generateHashtags && hashtagsMatch) {
          const hashtagsRaw = hashtagsMatch[1].trim();
          hashtags = hashtagsRaw
            .split(/\s+/)
            .map((h) => h.replace(/^#/, "").trim())
            .filter((h) => h.length > 0)
            .slice(0, 10);
        }

        // Generate image if requested (mock for now)
        let imageUrl = null;
        if (generateImage) {
          // TODO: Implement actual image generation
          imageUrl = null;
        }

        // Save to database
        const { data: post, error } = await supabase
          .from("posts")
          .insert({
            user_id: user.id,
            caption,
            hashtags,
            platform,
            status: "draft",
            image_url: imageUrl,
            engagement_data: {
              tone,
              wordCount,
              includeEmojis,
              generateHashtags,
            },
          })
          .select()
          .single();

        if (error) {
          console.error("Error saving post:", error);
          continue;
        }

        if (post) {
          posts.push({
            id: post.id,
            caption: post.caption,
            hashtags: post.hashtags || [],
            platform: post.platform,
            tone,
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      posts,
      count: posts.length 
    });
  } catch (error: any) {
    console.error("Error generating posts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate posts" },
      { status: 500 }
    );
  }
}

