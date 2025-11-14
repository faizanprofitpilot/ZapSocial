import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";

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
    const { prompt, tone = "friendly", platforms = [] } = body as {
      prompt?: string;
      tone?: string;
      platforms?: string[];
    };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const platformList = platforms.length > 0 ? platforms.join(", ") : "all social platforms";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You are an expert social media strategist. Provide concise, high-impact post ideas that can be dropped into a draft. Each idea must be short (max 18 words) and compelling.",
        },
        {
          role: "user",
          content: `Generate five post ideas for the following request. Tone should be ${tone}. Platforms: ${platformList}.

Request: ${prompt}

Return each idea on a new line without numbering.`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const ideas = text
      .split(/\n+/)
      .map((idea) => idea.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 5);

    return NextResponse.json({ success: true, ideas });
  } catch (error: any) {
    console.error("AI Copilot ideas error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
