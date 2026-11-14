import { connection, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

export async function GET() {
  await connection();

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Football API is not configured." },
      { status: 503 }
    );
  }

  const url = new URL("https://v3.football.api-sports.io/leagues");
  url.searchParams.set("current", "true");

  try {
    const data = await fetchFootballApiData<unknown>(url, apiKey, {
      next: { revalidate: 3600 },
    });

    return NextResponse.json({
      success: true,
      results: data.results ?? data.response.length,
      leagues: data.response,
    });
  } catch (error) {
    console.error("Football leagues API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit."
          : "Unable to retrieve leagues right now.",
      },
      { status }
    );
  }
}
