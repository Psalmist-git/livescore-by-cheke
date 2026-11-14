import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

const API = "https://v3.football.api-sports.io";
const YOUTH = /\\b(u\\s?17|u\\s?18|u\\s?19|u\\s?20|u\\s?21|u\\s?23|under[- ]?(17|18|19|20|21|23)|youth|academy|reserve|reserves| ii\\b|b team)\\b/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getName(value: unknown): string {
  return isRecord(value) && typeof value.name === "string" ? value.name : "";
}

function lagosDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET(request: NextRequest) {
  const key = process.env.API_FOOTBALL_KEY;
  const team = request.nextUrl.searchParams.get("team");

  if (!key) {
    return NextResponse.json(
      { success: false, error: "Football API is not configured." },
      { status: 503 }
    );
  }

  if (!team || !/^\d+$/.test(team) || Number(team) <= 0) {
    return NextResponse.json(
      { success: false, error: "A valid team ID is required." },
      { status: 400 }
    );
  }

  const from = new Date();
  const to = new Date();
  from.setUTCDate(from.getUTCDate() - 10);
  to.setUTCDate(to.getUTCDate() + 21);

  const url = new URL(`${API}/fixtures`);
  url.searchParams.set("team", team);
  url.searchParams.set("from", lagosDate(from));
  url.searchParams.set("to", lagosDate(to));
  url.searchParams.set("timezone", "Africa/Lagos");

  try {
    const data = await fetchFootballApiData<unknown>(url, key, {
      next: { revalidate: 900 },
    });
    const matches = data.response.filter((item) => {
      if (!isRecord(item)) return false;
      const teams = isRecord(item.teams) ? item.teams : {};
      return !YOUTH.test(
        `${getName(item.league)} ${getName(teams.home)} ${getName(teams.away)}`
      );
    });

    return NextResponse.json({ success: true, matches });
  } catch (error) {
    console.error("Team fixtures API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit."
          : "Unable to load team fixtures.",
      },
      { status }
    );
  }
}
