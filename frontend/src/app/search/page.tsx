"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useFavouriteLeagues } from "@/hooks/useFavouriteLeagues";

type SearchType = "all" | "teams" | "players" | "leagues" | "matches";

interface TeamResult {
  team: {
    id: number;
    name: string;
    logo: string;
    country: string | null;
    code: string | null;
    national: boolean;
  };
  venue?: {
    name: string | null;
    city: string | null;
  };
}

interface LeagueResult {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    flag: string | null;
  };
  seasons?: {
    year: number;
    current: boolean;
  }[];
}

interface PlayerResult {
  player: {
    id: number;
    name: string;
    age: number | null;
    nationality: string | null;
    photo: string | null;
    height?: string | null;
    weight?: string | null;
  };
  statistics?: Array<{
    team?: { name?: string; logo?: string };
    league?: { name?: string; season?: number };
    games?: { position?: string | null; number?: number | null };
  }>;
}

interface MatchResult {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    name: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface SearchResponse {
  success: boolean;
  error?: string;
  teams?: TeamResult[];
  leagues?: LeagueResult[];
  players?: PlayerResult[];
  matches?: MatchResult[];
  matchedTeam?: TeamResult | null;
}

const categories: {
  id: SearchType;
  label: string;
}[] = [
  { id: "all", label: "All Results" },
  { id: "teams", label: "Teams" },
  { id: "players", label: "Players" },
  { id: "leagues", label: "Leagues" },
  { id: "matches", label: "Matches" },
];

function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

function isLiveStatus(status: string) {
  return [
    "1H",
    "2H",
    "HT",
    "ET",
    "BT",
    "P",
    "LIVE",
  ].includes(status.toUpperCase());
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchType>("all");
  const { addFavourite, removeFavourite, isFavourite } = useFavouriteLeagues();

  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [leagues, setLeagues] = useState<LeagueResult[]>([]);
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchedTeam, setMatchedTeam] =
    useState<TeamResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchTerm = query.trim();

    if (searchTerm.length < (category === "players" ? 4 : 3)) {
      setError(
        category === "players"
          ? "Enter at least four characters to search for a player."
          : "Enter at least three characters to search."
      );
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(false);

      setTeams([]);
      setLeagues([]);
      setPlayers([]);
      setMatches([]);
      setMatchedTeam(null);

      const response = await fetch(
        `/api/football/search?type=${category}&query=${encodeURIComponent(searchTerm)}`,
        { cache: "no-store" }
      );

      const data: SearchResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to complete your search."
        );
      }

      setTeams(data.teams || []);
      setLeagues(data.leagues || []);
      setPlayers(data.players || []);
      setMatches(data.matches || []);
      setMatchedTeam(data.matchedTeam || null);

      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while searching."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />

      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40">
        <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Global Football Database
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              One Search.
              <span className="block text-green-400">
                The Entire Game.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Discover football teams, explore competitions
              and find recent match results from across the
              football world.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                Teams
              </span>

              <span className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                Players
              </span>
              <span className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                Competitions
              </span>

              <span className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                Match Results
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              Search Centre
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              What are you looking for?
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Search across the global football database.
            </p>

            <Link
              href="/compare"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20"
            >
              ⚖ Compare two players <span aria-hidden="true">→</span>
            </Link>
          </div>

          <form onSubmit={handleSearch}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                  ⌕
                </span>

                <input
                  id="global-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Arsenal, Haaland, Premier League..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-green-500 px-8 py-4 font-bold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="mt-7">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Search Category
              </p>

              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      category === item.id
                        ? "border border-green-400 bg-green-500 text-slate-950 shadow-lg shadow-green-950/20"
                        : "border border-slate-700 bg-slate-950 text-slate-300 hover:border-green-500 hover:text-green-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Enter at least three characters for teams and competitions. Player searches require four; match search also accepts a fixture ID.
            </p>
          </form>
        </div>

        {loading && (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 py-20 text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-green-400" />

            <h3 className="text-lg font-bold">
              Searching the Football World
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Retrieving teams, competitions and match information...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-xl text-red-400">
                !
              </span>

              <div>
                <h3 className="font-bold text-red-400">
                  Search Unavailable
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-300/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && searched && !error && (
          <div className="mt-12 space-y-12">
            {(category === "all" || category === "teams") && (
              <section>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                      Clubs & Countries
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Teams
                    </h2>
                  </div>

                  <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-400">
                    {teams.length} found
                  </span>
                </div>

                {teams.length === 0 ? (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
                    No matching teams found.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {teams.map((item) => (
                      <article
                        key={item.team.id}
                        className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-green-500/60"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 p-2">
                          {item.team.logo ? (
                            <img
                              src={item.team.logo}
                              alt={`${item.team.name} logo`}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="font-bold text-green-400">
                              {item.team.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words font-bold transition group-hover:text-green-400">
                            <Link
                              href={`/team/${item.team.id}`}
                              aria-label={`View ${item.team.name} team profile`}
                              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                            >
                              {item.team.name}
                            </Link>
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            {item.team.country || "Country unavailable"}
                          </p>

                          <div className="mt-2">
                            {item.team.national ? (
                              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                National Team
                              </span>
                            ) : (
                              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                                Club Team
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(category === "all" || category === "leagues") && (
              <section>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                      Global Competitions
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Leagues
                    </h2>
                  </div>

                  <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-400">
                    {leagues.length} found
                  </span>
                </div>

                {leagues.length === 0 ? (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
                    No matching leagues found.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {leagues.map((item) => (
                      <article
                        key={item.league.id}
                        className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-green-500/60"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 p-2">
                          {item.league.logo ? (
                            <img
                              src={item.league.logo}
                              alt={`${item.league.name} logo`}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-xl font-black text-green-400">
                              L
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words font-bold transition group-hover:text-green-400">
                            {item.league.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            {item.country?.name || "Country unavailable"}
                          </p>

                          <p className="mt-2 text-xs font-semibold text-green-400">
                            {item.league.type}
                          </p>
                          <button
                            type="button"
                            onClick={() => isFavourite(item.league.id)
                              ? removeFavourite(item.league.id)
                              : addFavourite({ league: item.league, country: item.country })}
                            className={`mt-3 rounded-lg border px-3 py-2 text-[10px] font-black transition ${isFavourite(item.league.id)
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                              : "border-slate-700 text-slate-300 hover:border-green-500 hover:text-green-400"}`}
                          >
                            {isFavourite(item.league.id) ? "✓ Following" : "+ Follow competition"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(category === "all" || category === "players") && (
              <section>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">Player Directory</p>
                    <h2 className="mt-2 text-2xl font-black">Players</h2>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-400">{players.length} found</span>
                </div>
                {players.length === 0 ? (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">No matching players found.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {players.map((item) => {
                      return (
                        <Link href={`/player/${item.player.id}`} key={item.player.id} className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-green-500/60">
                          {item.player.photo ? <img src={item.player.photo} alt="" className="h-16 w-16 shrink-0 rounded-full bg-slate-800 object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-800 font-black text-green-400">{item.player.name.slice(0,2).toUpperCase()}</div>}
                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-white transition group-hover:text-green-400">{item.player.name}</h3>
                            <p className="mt-1 text-xs text-slate-400">{item.player.nationality || "Nationality unavailable"}{item.player.age ? " · " + item.player.age + " years" : ""}</p>
                            <p className="mt-2 text-[10px] text-slate-500">{item.player.height || "Height unavailable"}{item.player.weight ? " · " + item.player.weight : ""}</p>
                            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-green-400">View player profile →</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {category === "matches" && (
              <section>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                      Recent Fixtures
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Match Results
                    </h2>

                    {matchedTeam && (
                      <p className="mt-2 text-sm text-slate-400">
                        Showing recent fixtures for{" "}
                        <Link
                          href={`/team/${matchedTeam.team.id}`}
                          className="font-semibold text-green-400 hover:text-green-300"
                        >
                          {matchedTeam.team.name}
                        </Link>
                      </p>
                    )}
                  </div>

                  <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-400">
                    {matches.length} matches
                  </span>
                </div>

                {matches.length === 0 ? (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
                    No recent fixtures were found for this team.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => {
                      const live = isLiveStatus(match.fixture.status.short);

                      return (
                        <article
                          key={match.fixture.id}
                          className="group rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-green-500/60 sm:p-6"
                        >
                          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-300">
                                {match.league.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {match.league.country}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {live && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                  Live
                                </span>
                              )}

                              <span className="text-xs text-slate-500">
                                {formatMatchDate(match.fixture.date)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-5">
                            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                              <img
                                src={match.teams.home.logo}
                                alt=""
                                className="h-9 w-9 shrink-0 object-contain sm:h-12 sm:w-12"
                              />

                              <Link
                                href={`/team/${match.teams.home.id}`}
                                aria-label={`View ${match.teams.home.name} team profile`}
                                className="break-words text-xs font-bold transition hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 sm:text-base"
                              >
                                {match.teams.home.name}
                              </Link>
                            </div>

                            <div className="min-w-[76px] text-center sm:min-w-[100px]">
                              <p className="text-2xl font-black tracking-wider sm:text-3xl">
                                {match.goals.home ?? "-"}
                                <span className="mx-1 text-slate-600">:</span>
                                {match.goals.away ?? "-"}
                              </p>

                              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                {match.fixture.status.long}
                              </p>

                              {match.fixture.status.elapsed !== null && live && (
                                <p className="mt-1 text-xs font-bold text-red-400">
                                  {match.fixture.status.elapsed}&apos;
                                </p>
                              )}
                            </div>

                            <div className="flex min-w-0 items-center justify-end gap-2 text-right sm:gap-3">
                              <Link
                                href={`/team/${match.teams.away.id}`}
                                aria-label={`View ${match.teams.away.name} team profile`}
                                className="break-words text-xs font-bold transition hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 sm:text-base"
                              >
                                {match.teams.away.name}
                              </Link>

                              <img
                                src={match.teams.away.logo}
                                alt=""
                                className="h-9 w-9 shrink-0 object-contain sm:h-12 sm:w-12"
                              />
                            </div>
                          </div>

                          <div className="mt-5 flex justify-end border-t border-slate-800 pt-4">
                            <Link
                              href={`/match/${match.fixture.id}`}
                              aria-label={`Open ${match.teams.home.name} vs ${match.teams.away.name} match centre`}
                              className="text-xs font-bold text-green-400 transition hover:translate-x-1 hover:text-green-300"
                            >
                              Open Match Centre →
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {!loading && !searched && !error && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-3xl">
              ⌕
            </div>

            <h2 className="text-xl font-bold sm:text-2xl">
              Search the World of Football
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
              Find teams, competitions and recent matches in one
              place. Enter a search term above to get started.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}