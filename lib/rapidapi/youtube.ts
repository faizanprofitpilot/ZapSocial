export async function fetchYouTubeTranscript(videoId: string) {
  const apiKey = process.env.RAPIDAPI_YOUTUBE_KEY;
  const host = process.env.RAPIDAPI_YOUTUBE_HOST || "youtube-transcript-api.p.rapidapi.com";

  if (!apiKey) {
    throw new Error("RAPIDAPI_YOUTUBE_KEY is not configured");
  }

  const response = await fetch(
    `https://${host}/transcript?video_id=${videoId}`,
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": host,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch transcript: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

