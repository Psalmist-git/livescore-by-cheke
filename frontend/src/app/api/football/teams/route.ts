import { connection, NextRequest, NextResponse } from "next/server";
import { fetchFootballApiData, FootballApiRequestError } from "@/lib/football-api";

export async function GET(request: NextRequest) {
  await connection();

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Football API is not configured." },
      { status: 503 }
    );
  }

  const search = request.nextUrl.searchParams.get("search")?.trim();
  if (!search || search.length < 3 || search.length > 80) {
    return NextResponse.json(
      { success: false, error: "Enter between 3 and 80 characters to search for a team." },
      { status: 400 }
    );
  }

  const url = new URL("https://v3.football.api-sports.io/teams");
  url.searchParams.set("search", search);

  try {
    const data = await fetchFootballApiData<unknown>(url, apiKey, {
      method: "GET",
      next: { revalidate: 60 },
    });

    return NextResponse.json({
      success: true,
      results: data.results ?? data.response.length,
      teams: data.response,
    });
  } catch (error) {
    console.error("Team search API error:", error);
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit. Please try again later."
          : "Unable to retrieve teams right now. Please try again later.",
      },
      { status }
    );
  }
}
