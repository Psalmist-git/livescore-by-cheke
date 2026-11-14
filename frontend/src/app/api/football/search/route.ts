import { connection, NextRequest, NextResponse } from "next/server";
import {
  fetchFootballApiData,
  FootballApiRequestError,
} from "@/lib/football-api";

const API_BASE = "https://v3.football.api-sports.io";

type SearchType = "all" | "teams" | "players" | "leagues" | "matches";

async function fetchFootballData(endpoint: string, apiKey: string): Promise<unknown[]> {
  const data = await fetchFootballApiData<unknown>(`${API_BASE}${endpoint}`, apiKey, {
    method: "GET",
    next: { revalidate: 60 },
  });
  return data.response;
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

    const query = request.nextUrl.searchParams.get("query")?.trim();
    const type = (request.nextUrl.searchParams.get("type") || "all") as SearchType;
    const allowedTypes: SearchType[] = ["all", "teams", "players", "leagues", "matches"];

    if (!query || query.length < 3 || query.length > 80) {
      return NextResponse.json(
        { success: false, error: "Enter between 3 and 80 characters to search." },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid search category." },
        { status: 400 }
      );
    }

    const encodedQuery = encodeURIComponent(query);

    if (type === "teams") {
      const teams = await fetchFootballData(`/teams?search=${encodedQuery}`, apiKey);
      return NextResponse.json({ success: true, type, teams });
    }

    if (type === "leagues") {
      const leagues = await fetchFootballData(`/leagues?search=${encodedQuery}`, apiKey);
      return NextResponse.json({ success: true, type, leagues });
    }

    if (type === "players") {
      if (query.length < 4) {
        return NextResponse.json({ success: true, type, players: [] });
      }
      const players = await fetchFootballData(`/players/profiles?search=${encodedQuery}`, apiKey);
      return NextResponse.json({ success: true, type, players });
    }

    if (type === "matches") {
      if (/^\d+$/.test(query)) {
        const matches = await fetchFootballData(`/fixtures?id=${encodeURIComponent(query)}`, apiKey);
        return NextResponse.json({ success: true, type, matches });
      }

      const teams = await fetchFootballData(`/teams?search=${encodedQuery}`, apiKey);
      if (teams.length === 0) {
        return NextResponse.json({ success: true, type, matchedTeam: null, matches: [] });
      }

      const exactMatch = teams.find((item) => {
        if (!item || typeof item !== "object") return false;
        const team = (item as { team?: { name?: unknown } }).team;
        return typeof team?.name === "string" &&
          team.name.toLowerCase() === query.toLowerCase();
      });
      const selectedTeam = exactMatch || teams[0];
      const team = selectedTeam as { team?: { id?: unknown } };
      const teamId = team.team?.id;

      if (!teamId || !/^\d+$/.test(String(teamId))) {
        throw new Error("The team search did not return a valid team ID.");
      }

      const currentSeason = new Date().getFullYear();
      const matches = await fetchFootballData(
        `/fixtures?team=${teamId}&season=${currentSeason}&last=10`,
        apiKey
      );

      return NextResponse.json({ success: true, type, matchedTeam: selectedTeam, matches });
    }

    const [teams, players, leagues] = await Promise.all([
      fetchFootballData(`/teams?search=${encodedQuery}`, apiKey),
      query.length >= 4
        ? fetchFootballData(`/players/profiles?search=${encodedQuery}`, apiKey)
        : Promise.resolve([]),
      fetchFootballData(`/leagues?search=${encodedQuery}`, apiKey),
    ]);

    return NextResponse.json({ success: true, type, teams, players, leagues });
  } catch (error) {
    const status = error instanceof FootballApiRequestError ? error.status : 502;
    console.error("Football search API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: status === 429
          ? "The football data provider has reached its request limit. Please try again later."
          : "Search is temporarily unavailable. Please try again.",
      },
      { status }
    );
  }
}
