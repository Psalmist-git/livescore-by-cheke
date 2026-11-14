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

function toHeadToHeadMatch(item: unknown) {
  if (!isRecord(item)) return null;

  const fixture = getRecord(item, "fixture");
  const status = getRecord(fixture, "status");
  const teams = getRecord(item, "teams");
  const home = getRecord(teams, "home");
  const away = getRecord(teams, "away");
  const goals = getRecord(item, "goals");
  const league = getRecord(item, "league");

  const statusShort = getString(status?.short);
  const id = getNumber(fixture?.id);
  const date = getString(fixture?.date);
  const homeName = getString(home?.name);
  const awayName = getString(away?.name);
  const homeId = getNumber(home?.id);
  const awayId = getNumber(away?.id);
  const competition = getString(league?.name);

  if (
    !id || !date || !homeName || !awayName ||
    homeId === null || awayId === null || !competition ||
    !["FT", "AET", "PEN"].includes(statusShort ?? "")
  ) {
    return null;
  }

  return {
    id,
    date,
    home: homeName,
    away: awayName,
    homeId,
    awayId,
    homeLogo: getString(home?.logo),
    awayLogo: getString(away?.logo),
    homeGoals: getNumber(goals?.home),
    awayGoals: getNumber(goals?.away),
    competition,
  };
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "Football API is not configured." }, { status: 503 });
  }

  const home = request.nextUrl.searchParams.get("home");
  const away = request.nextUrl.searchParams.get("away");
  if (!home || !away || !/^\d+$/.test(home) || !/^\d+$/.test(away) || home === away) {
    return NextResponse.json({ success: false, error: "Valid, different home and away team IDs are required." }, { status: 400 });
  }

  try {
    const url = new URL("https://v3.football.api-sports.io/fixtures");
    url.searchParams.set("h2h", `${home}-${away}`);
    url.searchParams.set("last", "5");
    url.searchParams.set("timezone", "Africa/Lagos");

    const data = await fetchFootballApiData<unknown>(url, apiKey, {
      next: { revalidate: 900 },
    });

    const matches = data.response
      .map(toHeadToHeadMatch)
      .filter((match): match is NonNullable<typeof match> => match !== null);

    return NextResponse.json({ success: true, matches });
  } catch (error) {
    console.error("Head-to-head API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      { success: false, error: status === 429
        ? "The football data provider has reached its request limit. Please try again later."
        : "Head-to-head data is temporarily unavailable." },
      { status }
    );
  }
}
