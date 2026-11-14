import { NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

const API_BASE_URL = "https://v3.football.api-sports.io";

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

function mapBookmaker(value: unknown) {
  const bookmaker = isRecord(value) ? value : null;
  if (!bookmaker) return null;

  const bets = Array.isArray(bookmaker.bets)
    ? bookmaker.bets.map((rawBet) => {
        const bet = isRecord(rawBet) ? rawBet : null;
        if (!bet) return null;

        const values = Array.isArray(bet.values)
          ? bet.values.flatMap((rawValue) => {
              const oddValue = isRecord(rawValue) ? rawValue : null;
              const label = oddValue ? getString(oddValue.value) : null;
              const odd = oddValue ? oddValue.odd : null;
              if (!label || odd === null || odd === undefined || odd === "") return [];
              return [{ label, odd: String(odd) }];
            })
          : [];

        if (values.length === 0) return [];
        return [{
          id: getNumber(bet.id),
          name: getString(bet.name),
          values,
        }];
      }).flat().filter((bet) => bet !== null)
    : [];

  if (bets.length === 0) return null;

  return {
    id: getNumber(bookmaker.id),
    name: getString(bookmaker.name),
    bets,
  };
}

export async function GET(request: NextRequest) {
  const fixtureId = request.nextUrl.searchParams.get("id");

  if (!fixtureId || !/^\d+$/.test(fixtureId) || Number(fixtureId) <= 0) {
    return NextResponse.json(
      { success: false, error: "A valid match ID is required." },
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

  try {
    const url = new URL(`${API_BASE_URL}/odds`);
    url.searchParams.set("fixture", fixtureId);

    const data = await fetchFootballApiData<unknown>(url, apiKey, {
      next: { revalidate: 10800 },
    });

    const fixtureOdds = data.response.find((item) => {
      const fixture = getRecord(item, "fixture");
      const id = fixture?.id;
      return id === undefined || String(id) === fixtureId;
    }) ?? data.response[0];

    const rawList = isRecord(fixtureOdds) && Array.isArray(fixtureOdds.bookmakers)
      ? fixtureOdds.bookmakers
      : [];
    const bookmakers = rawList
      .map(mapBookmaker)
      .filter((bookmaker): bookmaker is NonNullable<typeof bookmaker> => bookmaker !== null);

    const update = isRecord(fixtureOdds) ? getString(fixtureOdds.update) : null;

    return NextResponse.json({
      success: true,
      available: bookmakers.length > 0,
      updatedAt: update,
      bookmakers,
    });
  } catch (error) {
    if (error instanceof FootballApiRequestError) {
      if (error.status === 429) {
        return NextResponse.json({ success: true, available: false, bookmakers: [] });
      }
      if (error.status >= 500) {
        return NextResponse.json({ success: true, available: false, bookmakers: [] });
      }
    }

    console.error("Match odds API error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load match odds right now. Please try again." },
      { status: 502 }
    );
  }
}
