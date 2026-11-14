import { connection, NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

type StandingsResponse = {
  league?: {
    standings?: unknown;
  };
};

export async function GET(request: NextRequest) {
  await connection();

  const league = request.nextUrl.searchParams.get("league");
  const season = request.nextUrl.searchParams.get("season");

  if (
    !league ||
    !season ||
    !/^\d+$/.test(league) ||
    Number(league) <= 0 ||
    !/^\d{4}$/.test(season)
  ) {
    return NextResponse.json(
      { success: false, error: "A valid league ID and season are required." },
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

  const url = new URL("https://v3.football.api-sports.io/standings");
  url.searchParams.set("league", league);
  url.searchParams.set("season", season);

  try {
    const data = await fetchFootballApiData<StandingsResponse>(url, apiKey, {
      next: { revalidate: 3600 },
    });
    const leagueData = data.response[0]?.league;

    return NextResponse.json({
      success: true,
      results: data.results ?? data.response.length,
      league: leagueData ?? null,
      standings: Array.isArray(leagueData?.standings) ? leagueData.standings : [],
    });
  } catch (error) {
    console.error("Standings API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit."
          : "Unable to retrieve league standings.",
      },
      { status }
    );
  }
}
