import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get("id");
  const requestedSeason = request.nextUrl.searchParams.get("season");
  const season = requestedSeason || String(new Date().getFullYear());

  if (
    !playerId ||
    !/^\d+$/.test(playerId) ||
    Number(playerId) <= 0 ||
    !/^\d{4}$/.test(season)
  ) {
    return NextResponse.json(
      { success: false, error: "A valid player ID and season are required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Football API is not configured." },
      { status: 503 }
    );
  }

  const url = new URL("https://v3.football.api-sports.io/players");
  url.searchParams.set("id", playerId);
  url.searchParams.set("season", season);

  try {
    const data = await fetchFootballApiData<unknown>(url, apiKey, {
      next: { revalidate: 21600 },
    });

    return NextResponse.json({
      success: true,
      season,
      player: data.response[0] ?? null,
    });
  } catch (error) {
    console.error("Player profile API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit. Please try again later."
          : "Unable to load player data right now. Please try again.",
      },
      { status }
    );
  }
}
