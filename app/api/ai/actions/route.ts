import { NextResponse } from "next/server";
import { openai } from "@/lib/openai/client";
import { createClient } from "@/lib/supabase/server";

type ActionType =
  | "rewrite_x"
  | "rephrase"
  | "shorten"
  | "expand"
  | "hashtags"
  | "translate"
  | "tone";

function buildPrompt(action: ActionType, meta: string | undefined, tone: string | undefined): string {
  switch (action) {
    case "rewrite_x":
      return "Rewrite this caption so it fits within X (Twitter) best practices. Make it punchy, under 260 characters, and keep the call-to-action clear.";
    case "rephrase":
      return "Rephrase the caption to improve clarity while keeping the original meaning.";
    case "shorten":
      return "Shorten this caption while keeping the core message intact.";
    case "expand":
      return "Expand on this caption with one extra sentence that adds value.";
    case "hashtags":
      return "Generate 8 relevant hashtags separated by spaces. Do not include any other text.";
    case "translate":
      return `Translate this caption into ${meta ?? "English"}. Only return the translated caption.`;
    case "tone":
      return `Rewrite this caption in a ${meta ?? tone ?? "friendly"} tone while keeping the message and length similar.`;
    default:
      return "Improve this caption.";
  }
}

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
    const { text, action, meta, tone } = body as {
      text?: string;
      action?: ActionType;
      meta?: string;
      tone?: string;
    };

    if (!text || !text.trim() || !action) {
      return NextResponse.json({ error: "Text and action are required" }, { status: 400 });
    }

    const prompt = buildPrompt(action, meta, tone);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are an assistant that edits social media captions. Return only the transformed text without commentary.",
        },
        {
          role: "user",
          content: `${prompt}\n\nCaption:\n${text}`,
        },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("AI action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete AI action" },
      { status: 500 }
    );
  }
}
