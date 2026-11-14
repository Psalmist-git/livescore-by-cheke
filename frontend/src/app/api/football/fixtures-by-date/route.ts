import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

const API = "https://v3.football.api-sports.io";
const youthPattern =
  /\\b(u\\s?17|u\\s?18|u\\s?19|u\\s?20|u\\s?21|u\\s?23|under[- ]?(17|18|19|20|21|23)|youth|academy|reserve|reserves| ii\\b|b team)\\b/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getName(value: unknown): string {
  return isRecord(value) && typeof value.name === "string" ? value.name : "";
}

export async function GET(request: NextRequest) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Football API is not configured." },
      { status: 503 }
    );
  }

  const date = request.nextUrl.searchParams.get("date");
  const validDate =
    date &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

  if (!validDate) {
    return NextResponse.json(
      { success: false, error: "Provide a valid date in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const url = new URL(`${API}/fixtures`);
  url.searchParams.set("date", date);
  url.searchParams.set("timezone", "Africa/Lagos");

  try {
    const data = await fetchFootballApiData<unknown>(url, key, {
      next: { revalidate: 60 },
    });
    const matches = data.response.filter((item) => {
      if (!isRecord(item)) return false;
      const league = getName(item.league);
      const teams = isRecord(item.teams) ? item.teams : {};
      const home = getName(teams.home);
      const away = getName(teams.away);
      return !youthPattern.test(`${league} ${home} ${away}`);
    });

    return NextResponse.json({ success: true, date, results: matches.length, matches });
  } catch (error) {
    console.error("Fixtures-by-date API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit."
          : "Unable to fetch fixtures for this date. Please try again.",
      },
      { status }
    );
  }
}
