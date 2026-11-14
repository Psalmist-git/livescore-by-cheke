import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

const API = "https://v3.football.api-sports.io";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  const key = process.env.API_FOOTBALL_KEY;
  const teamId = request.nextUrl.searchParams.get("id");

  if (!key) {
    return NextResponse.json(
      { success: false, error: "Football API is not configured." },
      { status: 503 }
    );
  }

  if (!teamId || !/^\d+$/.test(teamId) || Number(teamId) <= 0) {
    return NextResponse.json(
      { success: false, error: "A valid team ID is required." },
      { status: 400 }
    );
  }

  const url = new URL(`${API}/teams`);
  url.searchParams.set("id", teamId);

  try {
    const data = await fetchFootballApiData<unknown>(url, key, {
      next: { revalidate: 3600 },
    });
    const item = data.response[0];

    if (!isRecord(item) || !isRecord(item.team)) {
      return NextResponse.json(
        { success: false, error: "Team not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      team: item.team,
      venue: item.venue ?? null,
    });
  } catch (error) {
    console.error("Team profile API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit."
          : "Unable to load team information.",
      },
      { status }
    );
  }
}
