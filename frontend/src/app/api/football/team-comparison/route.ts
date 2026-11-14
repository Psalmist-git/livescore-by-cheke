import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData } from "@/lib/football-api";

const API_BASE = "https://v3.football.api-sports.io";
const FINISHED = new Set(["FT", "AET", "PEN"]);

type HeadToHeadMatch = {
  id: number;
  date: string;
  homeId: number;
  awayId: number;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
  competition: string;
};

type Fixture = {
  fixture: { id: number; date: string; status: { short: string } };
  league: { name: string; country: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function isFixture(value: unknown): value is Fixture {
  if (!isRecord(value)) return false;
  const fixture = value.fixture;
  const league = value.league;
  const teams = value.teams;
  const goals = value.goals;

  if (!isRecord(fixture) || !isRecord(fixture.status)) return false;
  if (!isRecord(league) || !isRecord(teams) || !isRecord(goals)) return false;
  const home = teams.home;
  const away = teams.away;
  if (!isRecord(home) || !isRecord(away)) return false;

  return (
    isNumber(fixture.id) &&
    typeof fixture.date === "string" &&
    typeof fixture.status.short === "string" &&
    typeof league.name === "string" &&
    typeof league.country === "string" &&
    isNumber(home.id) &&
    typeof home.name === "string" &&
    typeof home.logo === "string" &&
    isNumber(away.id) &&
    typeof away.name === "string" &&
    typeof away.logo === "string" &&
    isNullableNumber(goals.home) &&
    isNullableNumber(goals.away)
  );
}

function summarize(teamId: number, fixtures: Fixture[]) {
  const played = fixtures
    .filter((match) => FINISHED.has(match.fixture.status.short))
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
    .slice(0, 10);

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;
  const form: { id: number; date: string; opponent: string; goalsFor: number; goalsAgainst: number; result: "W" | "D" | "L" }[] = [];

  for (const match of played) {
    const isHome = match.teams.home.id === teamId;
    const scored = (isHome ? match.goals.home : match.goals.away) ?? 0;
    const conceded = (isHome ? match.goals.away : match.goals.home) ?? 0;
    const opponent = isHome ? match.teams.away.name : match.teams.home.name;
    const result = scored > conceded ? "W" : scored < conceded ? "L" : "D";
    if (result === "W") wins++;
    else if (result === "D") draws++;
    else losses++;
    goalsFor += scored;
    goalsAgainst += conceded;
    if (conceded === 0) cleanSheets++;
    form.push({ id: match.fixture.id, date: match.fixture.date, opponent, goalsFor: scored, goalsAgainst: conceded, result });
  }

  const latest = played[0];
  const team = latest
    ? (latest.teams.home.id === teamId ? latest.teams.home : latest.teams.away)
    : null;

  return {
    team: team ? { id: team.id, name: team.name, logo: team.logo } : { id: teamId, name: "Team", logo: "" },
    matchesPlayed: played.length,
    wins, draws, losses, goalsFor, goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    cleanSheets,
    averageGoalsFor: played.length ? Number((goalsFor / played.length).toFixed(2)) : 0,
    averageGoalsAgainst: played.length ? Number((goalsAgainst / played.length).toFixed(2)) : 0,
    form,
  };
}

export async function GET(request: NextRequest) {
  const home = request.nextUrl.searchParams.get("home");
  const away = request.nextUrl.searchParams.get("away");
  if (
    !home ||
    !away ||
    !/^[0-9]+$/.test(home) ||
    !/^[0-9]+$/.test(away) ||
    Number(home) <= 0 ||
    Number(away) <= 0 ||
    home === away
  ) {
    return NextResponse.json({ success: false, error: "Select two different valid teams." }, { status: 400 });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "Unable to load data right now. Please try again later." }, { status: 503 });
  }

  try {
    const fetchFixtures = async (url: URL): Promise<Fixture[]> => {
      const data = await fetchFootballApiData<unknown>(url, apiKey, {
        next: { revalidate: 900 },
      });
      return data.response.filter(isFixture);
    };

    const homeUrl = new URL(`${API_BASE}/fixtures`);
    homeUrl.searchParams.set("team", home);
    homeUrl.searchParams.set("last", "10");
    homeUrl.searchParams.set("timezone", "Africa/Lagos");

    const awayUrl = new URL(`${API_BASE}/fixtures`);
    awayUrl.searchParams.set("team", away);
    awayUrl.searchParams.set("last", "10");
    awayUrl.searchParams.set("timezone", "Africa/Lagos");

    const headToHeadUrl = new URL(`${API_BASE}/fixtures`);
    headToHeadUrl.searchParams.set("h2h", `${home}-${away}`);
    headToHeadUrl.searchParams.set("last", "5");
    headToHeadUrl.searchParams.set("timezone", "Africa/Lagos");

    const [homeFixtures, awayFixtures, headToHeadFixtures] = await Promise.all([
      fetchFixtures(homeUrl),
      fetchFixtures(awayUrl),
      fetchFixtures(headToHeadUrl),
    ]);

    const headToHead: HeadToHeadMatch[] = headToHeadFixtures
      .filter((item) => FINISHED.has(item.fixture.status.short))
      .map((item) => ({
        id: item.fixture.id,
        date: item.fixture.date,
        homeId: item.teams.home.id,
        awayId: item.teams.away.id,
        home: item.teams.home.name,
        away: item.teams.away.name,
        homeLogo: item.teams.home.logo,
        awayLogo: item.teams.away.logo,
        homeGoals: item.goals.home,
        awayGoals: item.goals.away,
        competition: item.league.name,
      }));

    return NextResponse.json({
      success: true,
      home: summarize(Number(home), homeFixtures),
      away: summarize(Number(away), awayFixtures),
      headToHead,
    });
  } catch (error) {
    console.error("Team comparison API error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load data right now. Please try again later." },
      { status: 502 }
    );
  }
}
