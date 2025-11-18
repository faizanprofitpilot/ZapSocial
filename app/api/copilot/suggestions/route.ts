import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import { NextResponse } from "next/server";

const platformInstructions = {
  instagram: "Create an engaging Instagram post with emojis and relevant hashtags. Keep it visual and personal. Make it authentic and relatable.",
  linkedin: "Create a professional LinkedIn post that provides value and encourages engagement. Use a professional yet approachable tone. Share insights or ask thoughtful questions.",
  facebook: "Create a friendly Facebook post that encourages community engagement. Use a conversational tone. Make it shareable and engaging.",
  x: "Create a concise X (Twitter) post. Keep it under 280 characters. Make it punchy, engaging, and thought-provoking.",
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's recent posts for context
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("platform, caption, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Build context from recent posts
    let contextPrompt = "";
    if (recentPosts && recentPosts.length > 0) {
      contextPrompt = `Based on the user's recent posts, create fresh, varied suggestions that are different from their previous content:\n${recentPosts.map((p, i) => `${i + 1}. ${p.platform}: ${p.caption.substring(0, 100)}...`).join("\n")}\n\nGenerate new, unique suggestions that complement but don't repeat their previous content.`;
    } else {
      contextPrompt = "The user is new to posting. Create engaging, versatile suggestions that can help them get started.";
    }

    // Generate suggestions for all platforms in parallel
    const platforms = ["instagram", "linkedin", "facebook", "x"];
    
    const generateSuggestion = async (platform: string) => {
      const instruction = platformInstructions[platform as keyof typeof platformInstructions] || platformInstructions.instagram;
      
      const prompt = `${contextPrompt}

Generate a creative social media post suggestion for ${platform}.

${instruction}

Requirements:
- Write an engaging, unique caption (different from any previous posts)
- Include relevant emojis where appropriate (especially for Instagram)
- Include 5-10 relevant hashtags at the end
- Make it appropriate for ${platform}'s audience and format
- Be creative and avoid generic phrases

Format as:
CAPTION:
[caption text]

HASHTAGS:
[hashtag list separated by commas]`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert social media copywriter who creates engaging, platform-specific content. Always generate fresh, unique suggestions that vary in tone and topic.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.85,
          max_tokens: 200,
        });

        const content = completion.choices[0].message.content || "";
        const captionMatch = content.match(/CAPTION:\s*([\s\S]+?)(?=HASHTAGS:|$)/i);
        const hashtagsMatch = content.match(/HASHTAGS:\s*([\s\S]+)/i);

        let caption = captionMatch ? captionMatch[1].trim() : content.trim();
        let hashtags: string[] = [];

        if (hashtagsMatch) {
          hashtags = hashtagsMatch[1]
            .trim()
            .split(/[,\n]+/)
            .map((tag) => tag.trim().replace(/^#/, ""))
            .filter(Boolean)
            .slice(0, 10);
        }

        // Fallback if no hashtags found - extract from caption
        if (hashtags.length === 0) {
          const hashtagMatches = caption.match(/#[\w]+/g);
          if (hashtagMatches) {
            hashtags = hashtagMatches.map((tag) => tag.replace(/^#/, ""));
          }
        }

        // Clean caption - remove hashtags if they're at the end
        caption = caption.replace(/\s*#[\w]+\s*/g, " ").trim();

        return {
          platform,
          caption,
          hashtags,
        };
      } catch (error) {
        console.error(`Error generating suggestion for ${platform}:`, error);
        // Fallback suggestion if API fails
        return {
          platform,
          caption: `Share something valuable with your ${platform} audience today. What's on your mind?`,
          hashtags: [platform],
        };
      }
    };

    // Execute all API calls in parallel using Promise.all
    const suggestions = await Promise.all(
      platforms.map(platform => generateSuggestion(platform))
    );

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

