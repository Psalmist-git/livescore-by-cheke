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

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const url = new URL("https://v3.football.api-sports.io/fixtures");
  url.searchParams.set("date", today);
  url.searchParams.set("status", "NS");
  url.searchParams.set("timezone", "Africa/Lagos");

  try {
    const data = await fetchFootballApiData<unknown>(url, apiKey, {
      method: "GET",
      next: { revalidate: 60 },
    });

    return NextResponse.json({
      success: true,
      results: data.results,
      matches: data.response,
    });
  } catch (error) {
    console.error("Fixtures route failed:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      { success: false, error: status === 429
        ? "The football data provider has reached its request limit."
        : "Unable to retrieve fixtures." },
      { status }
    );
  }
}
