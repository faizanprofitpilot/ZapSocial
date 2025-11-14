import { extractVideoId } from "@/lib/rapidapi/youtube";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // YouTube thumbnail URLs
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Try to fetch title from oEmbed (free, no API key needed)
    try {
      const oEmbedResponse = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      if (oEmbedResponse.ok) {
        const oEmbedData = await oEmbedResponse.json();
        return NextResponse.json({
          videoId,
          title: oEmbedData.title,
          thumbnailUrl,
          fallbackThumbnail,
        });
      }
    } catch (error) {
      // Fallback if oEmbed fails
    }

    // Return metadata with unknown title
    return NextResponse.json({
      videoId,
      title: null,
      thumbnailUrl,
      fallbackThumbnail,
    });
  } catch (error: any) {
    console.error("Error fetching YouTube metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}

