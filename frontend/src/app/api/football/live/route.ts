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

  try {
    const data = await fetchFootballApiData<unknown>(
      "https://v3.football.api-sports.io/fixtures?live=all",
      apiKey,
      { method: "GET", next: { revalidate: 60 } }
    );

    return NextResponse.json({
      success: true,
      results: data.results,
      matches: data.response,
    });
  } catch (error) {
    console.error("Live football route failed:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      { success: false, error: status === 429
        ? "The football data provider has reached its request limit."
        : "Unable to retrieve live football data." },
      { status }
    );
  }
}
