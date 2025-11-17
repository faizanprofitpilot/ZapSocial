import { getOpenAI } from "@/lib/openai/client";

export interface GenerateReplyOptions {
  commentText: string;
  postCaption?: string;
  platform: "facebook" | "instagram" | "linkedin";
  tone: "friendly" | "professional" | "playful" | "witty";
  brandVoice?: string;
}

export async function generateCommentReply(
  options: GenerateReplyOptions
): Promise<string> {
  const { commentText, postCaption, platform, tone, brandVoice } = options;

  const platformToneMap = {
    facebook: "warm and conversational",
    instagram: "engaging and visually-aware",
    linkedin: "professional yet approachable",
  };

  const toneInstructions = {
    friendly: "Use a warm, welcoming tone. Be personable and genuine.",
    professional: "Maintain a polished, courteous tone. Be helpful and clear.",
    playful: "Be lighthearted and fun. Use humor where appropriate.",
    witty: "Be clever and engaging. Show personality without being inappropriate.",
  };

  const systemPrompt = `You are an AI social media manager for a brand. Your role is to reply to user comments in a way that boosts engagement, builds community, and maintains the brand's voice.

Guidelines:
- Keep replies concise (max 2-3 sentences, ideally 1-2)
- Sound natural and human-like, never robotic
- Be positive and helpful
- Match the platform's communication style: ${platformToneMap[platform]}
- Tone: ${toneInstructions[tone]}
${brandVoice ? `- Brand voice: ${brandVoice}` : ""}
- Avoid emojis unless the tone is playful and the comment warrants it
- Don't be overly salesy or promotional
- If the comment is a question, answer it directly
- If it's praise, thank them warmly
- If it's constructive feedback, acknowledge it graciously
- Never use emojis excessively (max 1-2 if any)
- Never sound like a bot or use automated language
- Keep it authentic and conversational`;

  const userPrompt = `Reply to this comment on ${platform}:

Comment: "${commentText}"
${postCaption ? `\nOriginal Post: "${postCaption.substring(0, 200)}${postCaption.length > 200 ? "..." : ""}"` : ""}

Generate a natural, engaging reply that matches the tone and platform style. Reply ONLY with the reply text, no explanations or meta-commentary.`;

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    const reply = response.choices[0]?.message?.content?.trim() || "";

    if (!reply) {
      throw new Error("Empty reply generated");
    }

    return reply;
  } catch (error) {
    console.error("Error generating comment reply:", error);
    throw error;
  }
}

