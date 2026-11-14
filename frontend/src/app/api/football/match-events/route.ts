import { connection, NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

const API_BASE_URL = "https://v3.football.api-sports.io";

export async function GET(request: NextRequest) {
  await connection();

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Football API is not configured." },
      { status: 503 }
    );
  }

  const matchId = request.nextUrl.searchParams.get("id");
  if (!matchId || !/^\d+$/.test(matchId) || Number(matchId) <= 0) {
    return NextResponse.json(
      { success: false, error: "A valid match ID is required." },
      { status: 400 }
    );
  }

  const eventsUrl = new URL(`${API_BASE_URL}/fixtures/events`);
  eventsUrl.searchParams.set("fixture", matchId);

  try {
    const data = await fetchFootballApiData<unknown>(eventsUrl, apiKey, {
      next: { revalidate: 30 },
    });

    return NextResponse.json(
      { success: true, events: data.response },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Match events refresh error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit."
          : "Unable to retrieve the latest match events.",
      },
      { status }
    );
  }
}
