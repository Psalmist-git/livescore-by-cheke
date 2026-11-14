import { NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

const API = "https://v3.football.api-sports.io";
const WINDOW_DAYS = 14;
const EXCLUDED = /\\b(u\\s?17|u\\s?18|u\\s?19|u\\s?20|u\\s?21|u\\s?23|under[- ]?(17|18|19|20|21|23)|youth|academy|reserve|reserves| ii\\b|b team)\\b/i;
const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"];
const INTERNATIONAL = /world cup|world cup qualifier|qualification.*world cup|nations league|african cup of nations|afcon|africa cup|euro qualifier|european championship|uefa euro|copa america|asian cup|afc asian|gold cup|concacaf|copa afric|international friendly/i;
const CLUB_CONTINENTAL = /club world cup|champions league|confederation cup|copa libertadores|copa sudamericana|europa league|conference league/i;

const POPULARITY: Array<[RegExp, number]> = [
  [/fifa world cup|world cup qualifier/i, 110],
  [/uefa champions league|champions league/i, 105],
  [/premier league/i, 102],
  [/african cup of nations|afcon/i, 100],
  [/uefa nations league|nations league/i, 96],
  [/copa america/i, 96],
  [/european championship|uefa euro/i, 96],
  [/la liga/i, 94],
  [/serie a/i, 92],
  [/bundesliga/i, 91],
  [/afc asian cup|asian cup/i, 90],
  [/europa league/i, 89],
  [/ligue 1/i, 86],
  [/copa libertadores/i, 88],
  [/caf champions league/i, 84],
  [/world cup qualification/i, 86],
  [/conference league/i, 82],
  [/fa cup|copa del rey|coppa italia|dfb pokal/i, 78],
  [/mls|major league soccer/i, 76],
  [/caf confederation cup/i, 75],
];

type RecordValue = Record<string, unknown>;

interface CompetitionFixture {
  fixtureId: number;
  date: string;
  status: string;
  league: {
    id: number;
    name: string;
    country: string | null;
    logo: string | null;
    season: number | null;
  };
  homeName: string;
  awayName: string;
}

interface CompetitionSummary {
  id: number;
  name: string;
  country: string;
  logo: string | null;
  season: number | null;
  category: "international" | "club";
  liveMatches: number;
  upcomingMatches: number;
  nextMatch: string | null;
  nextMatchTime: number;
  matchesNext7Days: number;
  matchesNext14Days: number;
}

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

function toCompetitionFixture(value: unknown): CompetitionFixture | null {
  const fixture = getRecord(value, "fixture");
  const league = getRecord(value, "league");
  const teams = getRecord(value, "teams");
  const home = getRecord(teams, "home");
  const away = getRecord(teams, "away");
  const status = getRecord(fixture, "status");

  const fixtureId = getNumber(fixture?.id);
  const leagueId = getNumber(league?.id);
  const date = getString(fixture?.date);
  const statusShort = getString(status?.short);
  const leagueName = getString(league?.name);

  if (
    fixtureId === null || leagueId === null || !date ||
    !statusShort || !leagueName
  ) {
    return null;
  }

  return {
    fixtureId,
    date,
    status: statusShort.toUpperCase(),
    league: {
      id: leagueId,
      name: leagueName,
      country: getString(league?.country),
      logo: getString(league?.logo),
      season: getNumber(league?.season),
    },
    homeName: getString(home?.name) ?? "",
    awayName: getString(away?.name) ?? "",
  };
}

function popularity(name: string): number {
  return POPULARITY.find(([pattern]) => pattern.test(name))?.[1] ?? 45;
}

function isInternational(leagueName: string): boolean {
  if (CLUB_CONTINENTAL.test(leagueName)) return false;
  return INTERNATIONAL.test(leagueName);
}

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Football API is not configured." },
      { status: 503 }
    );
  }

  try {
    const urls = [
      new URL(`${API}/fixtures?next=100&timezone=Africa%2FLagos`),
      new URL(`${API}/fixtures?live=all&timezone=Africa%2FLagos`),
    ];

    const payloads = await Promise.all(
      urls.map((url) =>
        fetchFootballApiData<unknown>(url, key, { next: { revalidate: 900 } })
      )
    );

    const now = Date.now();
    const windowEnd = now + WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const fixtures = new Map<number, CompetitionFixture>();

    for (const rawFixture of payloads.flatMap((payload) => payload.response)) {
      const fixture = toCompetitionFixture(rawFixture);
      if (!fixture) continue;

      const { league, status, date } = fixture;
      const teams = `${fixture.homeName} ${fixture.awayName}`;
      if (EXCLUDED.test(`${league.name} ${teams}`)) continue;

      const kickoff = new Date(date).getTime();
      const live = LIVE_STATUSES.includes(status);
      const upcoming = ["NS", "TBD"].includes(status);

      if (!live && (!upcoming || !Number.isFinite(kickoff) || kickoff > windowEnd)) continue;
      if (upcoming && kickoff < now - 60 * 60 * 1000) continue;

      fixtures.set(fixture.fixtureId, fixture);
    }

    const grouped = new Map<number, CompetitionSummary>();
    let internationalFixtureCount = 0;
    let clubFixtureCount = 0;

    for (const fixture of fixtures.values()) {
      const { league, status, date } = fixture;
      const kickoff = new Date(date).getTime();
      const live = LIVE_STATUSES.includes(status);
      const international = isInternational(league.name);

      if (international) internationalFixtureCount++;
      else clubFixtureCount++;

      let current = grouped.get(league.id);
      if (!current) {
        current = {
          id: league.id,
          name: league.name,
          country: league.country || "International",
          logo: league.logo,
          season: league.season,
          category: international ? "international" : "club",
          liveMatches: 0,
          upcomingMatches: 0,
          nextMatch: null,
          nextMatchTime: Number.POSITIVE_INFINITY,
          matchesNext7Days: 0,
          matchesNext14Days: 0,
        };
      }

      if (live) {
        current.liveMatches++;
      } else {
        current.upcomingMatches++;
        if (kickoff < current.nextMatchTime) {
          current.nextMatchTime = kickoff;
          current.nextMatch = date;
        }
        if (kickoff <= now + 7 * 24 * 60 * 60 * 1000) current.matchesNext7Days++;
        current.matchesNext14Days++;
      }

      grouped.set(league.id, current);
    }

    const competitions = [...grouped.values()]
      .map((competition) => {
        const score =
          popularity(competition.name) +
          competition.liveMatches * 18 +
          competition.matchesNext7Days * 9 +
          competition.matchesNext14Days * 3 +
          (competition.nextMatchTime <= now + 48 * 60 * 60 * 1000 ? 8 : 0);

        return { ...competition, relevanceScore: score };
      })
      .sort((a, b) =>
        b.relevanceScore - a.relevanceScore ||
        a.nextMatchTime - b.nextMatchTime ||
        a.name.localeCompare(b.name)
      )
      .slice(0, 30)
      .map(({ nextMatchTime, ...competition }) => competition);

    const focus =
      internationalFixtureCount > clubFixtureCount * 1.15
        ? "international"
        : clubFixtureCount > internationalFixtureCount * 1.15
          ? "club"
          : "balanced";

    return NextResponse.json({
      success: true,
      focus,
      windowDays: WINDOW_DAYS,
      fixtureCounts: {
        international: internationalFixtureCount,
        club: clubFixtureCount,
      },
      competitions,
    });
  } catch (error) {
    console.error("Active competitions API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json({
      success: false,
      error: status === 429
        ? "The football data provider has reached its request limit. Please try again later."
        : "Unable to load active competitions right now. Please try again later.",
    }, { status });
  }
}
