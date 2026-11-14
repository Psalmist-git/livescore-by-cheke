import { connection, NextRequest, NextResponse } from "next/server";
import { fetchFootballApi, hasFootballApiErrors } from "@/lib/football-api";

const API_BASE_URL = "https://v3.football.api-sports.io";

export async function GET(request: NextRequest) {
  await connection();
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Football API key is missing." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("id");

    if (!matchId || !/^\d+$/.test(matchId)) {
      return NextResponse.json(
        { success: false, error: "A valid match ID is required." },
        { status: 400 }
      );
    }

    const fixtureUrl = new URL(`${API_BASE_URL}/fixtures`);
    fixtureUrl.searchParams.set("id", matchId);

    const response = await fetchFootballApi(fixtureUrl.toString(), {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    if (!response.ok || hasFootballApiErrors(data.errors)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve the latest match status.",
        },
        { status: response.ok ? 502 : response.status }
      );
    }

    const match = data.response?.[0];

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match information was not found." },
        { status: 404 }
      );
    }

    // Keep this endpoint focused on score and status.
    // Match events are refreshed independently when the Overview tab is active.

    return NextResponse.json(
      {
        success: true,
        status: match.fixture.status,
        goals: match.goals,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Match status refresh error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to refresh the latest match status.",
      },
      { status: 500 }
    );
  }
}
