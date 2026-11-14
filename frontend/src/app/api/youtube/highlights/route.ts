import { connection, NextRequest, NextResponse } from "next/server";

import type { HighlightKind, HighlightVideo } from "@/types/highlights";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

const APPROVED_CHANNELS = [
  { name: "Premier League", id: "UCG5qGWdu8nIRZqJ_GgDwQ-w" },
  { name: "Sky Sports Football", id: "UCNAf1k0yIjyGu3k9BwAg3lg" },
] as const;

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  error?: { message?: string };
}

function cleanSearchValue(value: string | null): string {
  return (value || "")
    .replace(/[^\p{L}\p{N}\s.'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function buildSearchQuery(
  kind: HighlightKind,
  homeTeam: string,
  awayTeam: string,
  league: string,
): string {
  const teams = [homeTeam, awayTeam].filter(Boolean).join(" vs ");
  const competition = league ? `${league} ` : "";

  if (kind === "full") {
    return teams ? `${teams} ${competition}full match highlights` : `${competition}football match highlights`;
  }
  if (kind === "goals") {
    return teams ? `${teams} ${competition}goals highlights` : `${competition}football goals highlights`;
  }
  return teams ? `${teams} ${competition}football highlights goals` : "football match highlights goals";
}

async function fetchChannelVideos(
  channel: (typeof APPROVED_CHANNELS)[number],
  query: string,
  hasSpecificMatch: boolean,
): Promise<HighlightVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YouTube API key is not configured.");

  const url = new URL(YOUTUBE_API_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("channelId", channel.id);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("q", query);
  url.searchParams.set("order", hasSpecificMatch ? "relevance" : "date");
  url.searchParams.set("regionCode", "NG");
  url.searchParams.set("relevanceLanguage", "en");

  const response = await fetch(url.toString(), {
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(12000),
  });

  let data: YouTubeSearchResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error("YouTube returned an invalid response.");
  }

  if (!response.ok || data.error) {
    throw new Error(response.status === 429
      ? "YouTube request limit reached."
      : "YouTube provider request failed.");
  }

  if (data.items !== undefined && !Array.isArray(data.items)) {
    throw new Error("YouTube returned an unexpected video list.");
  }

  return (data.items || [])
    .filter((item) =>
      typeof item.id?.videoId === "string" &&
      item.snippet?.channelId === channel.id
    )
    .map((item) => {
      const videoId = item.id!.videoId!;
      const snippet = item.snippet!;
      return {
        id: videoId,
        title: snippet.title || "Football highlights",
        description: snippet.description || "",
        channelTitle: snippet.channelTitle || channel.name,
        channelId: snippet.channelId || channel.id,
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          "",
        publishedAt: snippet.publishedAt || "",
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      };
    });
}

export async function GET(request: NextRequest) {
  await connection();

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { success: false, videos: [], error: "YouTube API is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedKind = searchParams.get("kind") || "all";
  const allowedKinds: HighlightKind[] = ["all", "full", "goals"];

  if (!allowedKinds.includes(requestedKind as HighlightKind)) {
    return NextResponse.json(
      { success: false, videos: [], error: "Invalid highlights category." },
      { status: 400 }
    );
  }

  const kind = requestedKind as HighlightKind;
  const homeTeam = cleanSearchValue(searchParams.get("home"));
  const awayTeam = cleanSearchValue(searchParams.get("away"));
  const league = cleanSearchValue(searchParams.get("league"));
  const hasSpecificMatch = Boolean(homeTeam && awayTeam);
  const query = buildSearchQuery(kind, homeTeam, awayTeam, league);

  const results = await Promise.allSettled(
    APPROVED_CHANNELS.map((channel) =>
      fetchChannelVideos(channel, query, hasSpecificMatch)
    )
  );

  const videos: HighlightVideo[] = [];
  const failedSources: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") videos.push(...result.value);
    else failedSources.push(APPROVED_CHANNELS[index].name);
  });

  if (videos.length === 0 && failedSources.length === APPROVED_CHANNELS.length) {
    return NextResponse.json(
      {
        success: false,
        videos: [],
        failedSources,
        error: "YouTube highlights are temporarily unavailable.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const uniqueVideos = Array.from(
    new Map(videos.map((video) => [video.id, video])).values()
  );

  uniqueVideos.sort((first, second) => {
    const firstDate = Date.parse(first.publishedAt);
    const secondDate = Date.parse(second.publishedAt);
    return (Number.isNaN(secondDate) ? 0 : secondDate) -
      (Number.isNaN(firstDate) ? 0 : firstDate);
  });

  return NextResponse.json(
    {
      success: true,
      kind,
      videos: uniqueVideos,
      failedSources,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
