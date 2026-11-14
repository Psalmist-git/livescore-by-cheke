import { connection, NextRequest, NextResponse } from "next/server";
import { fetchFootballApi, hasFootballApiErrors } from "@/lib/football-api";

const API_BASE_URL = "https://v3.football.api-sports.io";

type RecordValue = Record<string, unknown>;

type EndpointResult = {
  data: unknown[];
  diagnostic: {
    endpoint: string;
    httpStatus: number | null;
    success: boolean;
    results: number;
    errors: unknown;
    message: string;
  };
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fetchOptionalMatchData(
  endpoint: string,
  matchId: string,
  apiKey: string
): Promise<EndpointResult> {
  try {
    const url = new URL(`${API_BASE_URL}/${endpoint}`);
    url.searchParams.set("fixture", matchId);

    const revalidateSeconds =
      endpoint === "fixtures/events" ? 60 :
      endpoint === "fixtures/lineups" ? 3600 :
      endpoint === "injuries" ? 600 : 300;

    const response = await fetchFootballApi(url, {
      headers: { "x-apisports-key": apiKey },
      next: { revalidate: revalidateSeconds },
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        data: [],
        diagnostic: {
          endpoint, httpStatus: response.status, success: false, results: 0,
          errors: null, message: "The API returned an invalid JSON response.",
        },
      };
    }

    const apiErrors = isRecord(payload) ? payload.errors ?? null : null;
    const responseData = isRecord(payload) ? payload.response : null;
    if (!response.ok || hasFootballApiErrors(apiErrors) || !Array.isArray(responseData)) {
      return {
        data: [],
        diagnostic: {
          endpoint, httpStatus: response.status, success: false, results: 0,
          errors: apiErrors, message: "The API request failed or returned unexpected data.",
        },
      };
    }

    return {
      data: responseData,
      diagnostic: {
        endpoint, httpStatus: response.status, success: true,
        results: responseData.length, errors: null,
        message: responseData.length > 0
          ? "Data retrieved successfully."
          : "The API request succeeded but returned no data.",
      },
    };
  } catch (error) {
    return {
      data: [],
      diagnostic: {
        endpoint, httpStatus: null, success: false, results: 0, errors: null,
        message: error instanceof Error ? error.message : "An unexpected network error occurred.",
      },
    };
  }
}

function skippedOptionalMatchData(endpoint: string): EndpointResult {
  return {
    data: [],
    diagnostic: {
      endpoint, httpStatus: null, success: true, results: 0, errors: null,
      message: "Skipped because the fixture has not started.",
    },
  };
}

export async function GET(request: NextRequest) {
  await connection();
  try {
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

    const fixtureUrl = new URL(`${API_BASE_URL}/fixtures`);
    fixtureUrl.searchParams.set("id", matchId);

    const fixtureResponse = await fetchFootballApi(fixtureUrl, {
      headers: { "x-apisports-key": apiKey },
      next: { revalidate: 30 },
    });

    let fixturePayload: unknown;
    try {
      fixturePayload = await fixtureResponse.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "The football data provider returned an invalid response." },
        { status: 502 }
      );
    }

    const fixtureErrors = isRecord(fixturePayload) ? fixturePayload.errors : null;
    const fixtureList = isRecord(fixturePayload) ? fixturePayload.response : null;

    if (!fixtureResponse.ok || hasFootballApiErrors(fixtureErrors)) {
      return NextResponse.json(
        { success: false, error: "Unable to retrieve match information." },
        { status: fixtureResponse.ok ? 502 : fixtureResponse.status }
      );
    }

    if (!Array.isArray(fixtureList)) {
      return NextResponse.json(
        { success: false, error: "The football data provider returned unexpected match data." },
        { status: 502 }
      );
    }

    const match = fixtureList[0];
    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match information was not found." },
        { status: 404 }
      );
    }

    const fixture = isRecord(match) && isRecord(match.fixture) ? match.fixture : null;
    const matchStatus = fixture && isRecord(fixture.status) ? fixture.status.short : null;
    const isScheduled = ["NS", "TBD"].includes(String(matchStatus || "").toUpperCase());

    const [eventsResult, lineupsResult, statisticsResult, playersResult, injuriesResult] =
      await Promise.all([
        isScheduled ? Promise.resolve(skippedOptionalMatchData("fixtures/events")) :
          fetchOptionalMatchData("fixtures/events", matchId, apiKey),
        fetchOptionalMatchData("fixtures/lineups", matchId, apiKey),
        isScheduled ? Promise.resolve(skippedOptionalMatchData("fixtures/statistics")) :
          fetchOptionalMatchData("fixtures/statistics", matchId, apiKey),
        isScheduled ? Promise.resolve(skippedOptionalMatchData("fixtures/players")) :
          fetchOptionalMatchData("fixtures/players", matchId, apiKey),
        fetchOptionalMatchData("injuries", matchId, apiKey),
      ]);

    return NextResponse.json({
      success: true,
      match: {
        ...(isRecord(match) ? match : {}),
        events: eventsResult.data,
        lineups: lineupsResult.data,
        statistics: statisticsResult.data,
        players: playersResult.data,
        injuries: injuriesResult.data,
      },
      diagnostics: {
        events: eventsResult.diagnostic,
        lineups: lineupsResult.diagnostic,
        statistics: statisticsResult.diagnostic,
        players: playersResult.diagnostic,
        injuries: injuriesResult.diagnostic,
      },
    });
  } catch (error) {
    console.error("Match Centre API error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong while retrieving match information." },
      { status: 502 }
    );
  }
}
