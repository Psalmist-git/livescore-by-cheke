import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapRecentFormFixture(value: unknown, teamId: number) {
  const fixture = getRecord(value, "fixture");
  const status = getRecord(fixture, "status");
  const teams = getRecord(value, "teams");
  const home = getRecord(teams, "home");
  const away = getRecord(teams, "away");
  const goals = getRecord(value, "goals");

  const statusShort = getString(status?.short);
  if (!["FT", "AET", "PEN"].includes(statusShort ?? "")) return null;

  const homeId = getNumber(home?.id);
  const awayId = getNumber(away?.id);
  const homeName = getString(home?.name);
  const awayName = getString(away?.name);
  const id = getNumber(fixture?.id);
  const date = getString(fixture?.date);
  const homeGoals = getNumber(goals?.home);
  const awayGoals = getNumber(goals?.away);

  if (
    homeId === null || awayId === null ||
    !homeName || !awayName || id === null || !date ||
    homeGoals === null || awayGoals === null
  ) {
    return null;
  }

  const isHome = homeId === teamId;
  if (!isHome && awayId !== teamId) return null;

  const goalsFor = isHome ? homeGoals : awayGoals;
  const goalsAgainst = isHome ? awayGoals : homeGoals;

  return {
    id,
    date,
    opponent: isHome ? awayName : homeName,
    goalsFor,
    goalsAgainst,
    result: goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D",
  };
}

export async function GET(request: NextRequest) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return NextResponse.json({ success: false, error: "Football API is not configured." }, { status: 503 });
  }

  const home = request.nextUrl.searchParams.get("home");
  const away = request.nextUrl.searchParams.get("away");
  if (
    !home || !away ||
    !/^\d+$/.test(home) || !/^\d+$/.test(away) ||
    Number(home) <= 0 || Number(away) <= 0 || home === away
  ) {
    return NextResponse.json({ success: false, error: "Valid, different home and away team IDs are required." }, { status: 400 });
  }

  const fetchForm = async (team: string) => {
    const url = new URL("https://v3.football.api-sports.io/fixtures");
    url.searchParams.set("team", team);
    url.searchParams.set("last", "10");
    url.searchParams.set("timezone", "Africa/Lagos");

    const data = await fetchFootballApiData<unknown>(url, key, {
      next: { revalidate: 900 },
    });

    return data.response
      .map((item) => mapRecentFormFixture(item, Number(team)))
      .filter((match): match is NonNullable<typeof match> => match !== null)
      .slice(0, 5);
  };

  try {
    const [homeForm, awayForm] = await Promise.all([fetchForm(home), fetchForm(away)]);
    return NextResponse.json({ success: true, home: homeForm, away: awayForm });
  } catch (error) {
    console.error("Team form API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit. Please try again later."
          : "Unable to load recent form right now. Please try again.",
      },
      { status }
    );
  }
}
