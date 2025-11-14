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

    const { message, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch conversation history if conversationId is provided
    // Note: The current user message may have just been saved, so we fetch all messages
    // The current message will be added at the end, so we include all history for context
    let conversationHistory: Array<{ role: string; content: string }> = [];
    if (conversationId) {
      const { data: messages } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(30); // Last 30 messages for context

      if (messages) {
        conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        
        // Remove the last message if it's the same as the current user message (to avoid duplication)
        // This can happen if the user message was saved before the API call
        const lastMessage = conversationHistory[conversationHistory.length - 1];
        if (lastMessage && lastMessage.role === "user" && lastMessage.content === message) {
          conversationHistory.pop();
        }
      }
    }

    // Fetch user's recent posts for context
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("caption, platform, hashtags")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch Google Business Profile data if available
    const { data: gbpIntegration } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "google-business")
      .single();

    let businessContext = "";
    if (gbpIntegration) {
      // In the future, fetch actual business profile data from Google API
      // For now, we'll use stored metadata or mock data
      businessContext = `Business Profile: Connected. Use business information to provide relevant suggestions.`;
    }

    const postsContext = recentPosts && recentPosts.length > 0
      ? `User's recent posts:\n${recentPosts.map((p, i) => `${i + 1}. ${p.platform}: ${p.caption.substring(0, 100)}...`).join("\n")}`
      : "User has no posts yet.";

    const context = `${businessContext}\n\n${postsContext}`;

    const systemPrompt = `You are an AI Chief Marketing Officer (CMO) helping small and medium businesses (SMBs) with their marketing strategy. Your role is to provide strategic, actionable marketing advice.

Key responsibilities:
- Develop comprehensive marketing strategies
- Provide content ideas and campaign suggestions
- Offer platform-specific best practices (Instagram, LinkedIn, Facebook, X/Twitter)
- Help with engagement optimization and growth tactics
- Suggest ways to improve ROI and conversion rates
- Guide on brand positioning and messaging
- Recommend content calendars and scheduling strategies

Be conversational, professional, and practical. Think like a CMO would - focus on strategy, results, and actionable steps. Reference the user's business profile and recent posts when relevant. Always provide clear, actionable advice that SMBs can implement immediately.`;

    // Build messages array with system prompts, context, conversation history, and current message
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Context: ${context}` },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";

    // Note: Messages are saved in the client to avoid duplicating the conversationId logic
    // The client will save both user and assistant messages after receiving the response

    return NextResponse.json({ response, conversationId });
  } catch (error: any) {
    console.error("Error in copilot chat:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get response" },
      { status: 500 }
    );
  }
}

