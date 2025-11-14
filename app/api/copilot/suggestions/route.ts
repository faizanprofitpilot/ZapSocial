import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return dummy suggestions by default (will use Google Business Profile data when connected)
    const dummySuggestions = [
      {
        platform: "instagram",
        caption: "✨ New week, new opportunities! Ready to make an impact? Share what you're working on this week in the comments below. Let's inspire each other! 💪",
        hashtags: ["motivation", "business", "entrepreneurship", "growth", "success", "inspiration", "community"],
      },
      {
        platform: "linkedin",
        caption: "Exciting things are happening! We're constantly evolving and improving to serve you better. What's one thing you'd like to see more of from us? Your feedback drives our innovation. 🚀",
        hashtags: ["innovation", "businessgrowth", "leadership"],
      },
      {
        platform: "x",
        caption: "Quick tip: Consistency beats perfection every time. Small daily actions compound into extraordinary results. What's one small step you're taking today? 💡",
        hashtags: ["productivity", "growth"],
      },
    ];

    // Check if Google Business Profile is connected for personalized suggestions
    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "google-business")
      .single();

    // If connected, generate personalized suggestions (for future implementation)
    // For now, return dummy data
    const suggestions = dummySuggestions;

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

