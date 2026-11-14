"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Header from "@/components/Header";
import FixtureCard from "@/components/FixtureCard";
import StandingsTable from "@/components/StandingsTable";
import Footer from "@/components/Footer";
import LeagueFavouriteButton from "@/components/LeagueFavouriteButton";
import FollowedLeaguesPanel from "@/components/FollowedLeaguesPanel";

import type { Match } from "@/types/football";

interface LeagueSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
}

interface League {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: LeagueSeason[];
}

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
  };
  league: {
    name: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      code: string | null;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      code: string | null;
      logo: string;
    };
  };
}

interface Standing {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
}

interface LeaguesResponse {
  success: boolean;
  leagues: League[];
  error?: string;
}

interface FixturesResponse {
  success: boolean;
  matches: ApiFixture[];
  error?: string;
}

interface StandingsResponse {
  success: boolean;
  standings: Standing[][];
  error?: string;
}

type LeagueView = "fixtures" | "standings";

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[][]>([]);

  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<LeagueView>("standings");

  const [loading, setLoading] = useState(true);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [standingsLoading, setStandingsLoading] = useState(false);

  const [error, setError] = useState("");
  const [fixturesError, setFixturesError] = useState("");
  const [standingsError, setStandingsError] = useState("");

  const fetchLeagues = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/football/leagues", {
        cache: "no-store",
      });

      const data: LeaguesResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Unable to load football competitions."
        );
      }

      setLeagues(data.leagues || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading leagues."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeagues();
  }, [fetchLeagues]);

  const queryLeagueHandled = useRef(false);

  useEffect(() => {
    if (leagues.length === 0 || queryLeagueHandled.current) return;

    const requestedLeagueId = Number(
      new URLSearchParams(window.location.search).get("league")
    );

    if (!Number.isSafeInteger(requestedLeagueId) || requestedLeagueId <= 0) {
      return;
    }

    const requestedLeague = leagues.find(
      (item) => item.league.id === requestedLeagueId
    );

    if (requestedLeague) {
      queryLeagueHandled.current = true;
      void selectLeague(requestedLeague);
    }
  }, [leagues]);

  async function selectLeague(league: League) {
    setSelectedLeague(league);

    setFixtures([]);
    setStandings([]);

    setFixturesError("");
    setStandingsError("");

    setActiveView("standings");

    const currentSeason =
      league.seasons.find((season) => season.current) ||
      [...league.seasons]
        .filter((season) => season.year <= new Date().getFullYear())
        .sort((a, b) => b.year - a.year)[0];

    if (!currentSeason) {
      setStandingsError("No available season was found for this league.");
      setFixturesError("No available season was found for this league.");
      return;
    }

    const leagueId = league.league.id;
    const season = currentSeason.year;

    setFixturesLoading(true);
    setStandingsLoading(true);

    const fixturesRequest = fetch(
      `/api/football/league-fixtures?league=${leagueId}&season=${season}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        const data: FixturesResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Unable to retrieve league fixtures."
          );
        }

        const formattedMatches: Match[] = (data.matches ?? []).map(
          (fixture) => ({
            id: fixture.fixture.id,
            league: fixture.league.name,
            status: "UPCOMING",

            kickoff: new Date(fixture.fixture.date).toLocaleString(
              "en-NG",
              {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Africa/Lagos",
              }
            ),

            homeTeam: {
              id: fixture.teams.home.id,
              name: fixture.teams.home.name,
              shortName:
                fixture.teams.home.code ||
                fixture.teams.home.name.substring(0, 3).toUpperCase(),
              logo: fixture.teams.home.logo,
            },

            awayTeam: {
              id: fixture.teams.away.id,
              name: fixture.teams.away.name,
              shortName:
                fixture.teams.away.code ||
                fixture.teams.away.name.substring(0, 3).toUpperCase(),
              logo: fixture.teams.away.logo,
            },

            homeScore: null,
            awayScore: null,
          })
        );

        setFixtures(formattedMatches);
      })
      .catch((err: unknown) => {
        setFixturesError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve league fixtures."
        );
      })
      .finally(() => {
        setFixturesLoading(false);
      });

    const standingsRequest = fetch(
      `/api/football/standings?league=${leagueId}&season=${season}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        const data: StandingsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Unable to retrieve league standings."
          );
        }

        setStandings(data.standings || []);
      })
      .catch((err: unknown) => {
        setStandingsError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve league standings."
        );
      })
      .finally(() => {
        setStandingsLoading(false);
      });

    await Promise.all([fixturesRequest, standingsRequest]);
  }

  const filteredLeagues = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return leagues.filter((league) => {
      return (
        league.league.name.toLowerCase().includes(searchText) ||
        league.country.name.toLowerCase().includes(searchText)
      );
    });
  }, [leagues, search]);

  const currentSeason = selectedLeague?.seasons.find(
    (season) => season.current
  );

  return (
    <main className="min-h-screen bg-[#0b1118] text-white">
      <Header />

      <div className="mx-auto max-w-[1500px] px-3 py-6 sm:px-5 sm:py-9 lg:px-6">

        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-[#12372e] via-[#172b2b] to-[#141e29] p-6 sm:p-9">

          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-emerald-300/[0.05]" />

          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-emerald-400/[0.05] blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">

            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Global Football Coverage
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                Explore Competitions
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                From the biggest European leagues to competitions across
                the world, discover teams, league tables and upcoming
                fixtures in one place.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#competitions"
                  className="rounded-lg bg-emerald-400 px-5 py-3 text-xs font-black text-[#07130e] transition hover:bg-emerald-300"
                >
                  Explore Leagues ↓
                </a>

                <a
                  href="#selected-league"
                  className="rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-bold text-white transition hover:border-emerald-400/50"
                >
                  View League Details
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                Competitions Available
              </p>

              <p className="mt-3 text-5xl font-black">
                {loading ? "..." : error ? "—" : leagues.length}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Football competitions
              </p>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Search Results
                </p>

                <p className="mt-1 text-xl font-black text-emerald-400">
                  {filteredLeagues.length}
                </p>
              </div>
            </div>

          </div>
        </section>

        <FollowedLeaguesPanel />

        {/* COMPETITION DISCOVERY */}
        <section id="competitions" className="mt-8">

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
                  Discover Football
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Available Competitions
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Find a competition and explore its football data.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchLeagues()}
              disabled={loading}
              className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs font-black text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Loading..." : "↻ Refresh Leagues"}
            </button>
          </div>

          {/* SEARCH */}
          <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#141e29] p-3 sm:p-4">
            <label
              htmlFor="league-search"
              className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400"
            >
              Search competitions
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0e1721] px-4">
              <span className="text-lg text-emerald-400">⌕</span>

              <input
                id="league-search"
                type="search"
                placeholder="Search by league or country..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs font-bold text-slate-400 transition hover:text-emerald-400"
                >
                  CLEAR
                </button>
              )}
            </div>

            <p className="mt-3 px-1 text-[10px] text-slate-500">
              Showing {filteredLeagues.length} of {leagues.length} competitions
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#141e29] p-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />

              <p className="text-sm text-slate-400">
                Loading football competitions...
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="font-bold text-red-400">
                Unable to load competitions
              </h3>

              <p className="mt-2 break-words text-sm text-slate-300">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void fetchLeagues()}
                className="mt-4 rounded-lg bg-red-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-400"
              >
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY SEARCH */}
          {!loading && !error && filteredLeagues.length === 0 && (
            <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#141e29] p-10 text-center">
              <p className="text-4xl">🔎</p>

              <h3 className="mt-4 text-lg font-black">
                No Competitions Found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another league name or country.
              </p>

              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* LEAGUE CARDS */}
          {!loading && !error && filteredLeagues.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {filteredLeagues.map((league) => {
                const isSelected =
                  selectedLeague?.league.id === league.league.id;

                const season =
                  league.seasons.find((item) => item.current) ||
                  [...league.seasons].sort(
                    (a, b) => b.year - a.year
                  )[0];

                return (
                  <button
                    key={league.league.id}
                    type="button"
                    onClick={() => void selectLeague(league)}
                    className={`group rounded-xl border p-4 text-left transition duration-200 hover:-translate-y-1 ${
                      isSelected
                        ? "border-emerald-400/60 bg-emerald-500/[0.08] shadow-lg shadow-emerald-950/20"
                        : "border-white/[0.07] bg-[#141e29] hover:border-emerald-500/40 hover:bg-[#192634]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-md border border-white/[0.07] bg-[#0e1721] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {league.league.type}
                      </span>

                      {isSelected && (
                        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-400">
                          Selected
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex h-20 items-center justify-center rounded-lg bg-[#0e1721] p-3">
                      {league.league.logo ? (
                        <img
                          src={league.league.logo}
                          alt={`${league.league.name} logo`}
                          className="h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl">⚽</span>
                      )}
                    </div>

                    <h3 className="mt-5 min-h-10 text-sm font-black leading-5 text-white transition group-hover:text-emerald-300">
                      {league.league.name}
                    </h3>

                    <div className="mt-3 flex items-center gap-2">
                      {league.country.flag ? (
                        <img
                          src={league.country.flag}
                          alt=""
                          className="h-4 w-5 rounded-sm object-cover"
                        />
                      ) : (
                        <span className="h-4 w-5 rounded-sm bg-slate-700" />
                      )}

                      <span className="text-xs text-slate-400">
                        {league.country.name}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                      <span className="text-[10px] font-bold text-slate-500">
                        SEASON {season?.year ?? "N/A"}
                      </span>

                      <span className="text-xs font-black text-emerald-400">
                        {isSelected ? "Viewing" : "Explore →"}
                      </span>
                    </div>
                  </button>
                );
              })}

            </div>
          )}

        </section>

        {/* SELECTED LEAGUE */}
        {selectedLeague && (
          <section
            id="selected-league"
            className="mt-12 scroll-mt-24 overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#141e29]"
          >

            {/* SELECTED LEAGUE HEADER */}
            <div className="relative overflow-hidden border-b border-white/[0.07] bg-gradient-to-r from-[#12372e] to-[#172b2b] p-5 sm:p-7">

              <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border-[25px] border-emerald-300/[0.05]" />

              <div className="relative z-10 flex flex-wrap items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 p-3">
                  {selectedLeague.league.logo && (
                    <img
                      src={selectedLeague.league.logo}
                      alt={`${selectedLeague.league.name} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                    Selected Competition
                  </p>

                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                    {selectedLeague.league.name}
                  </h2>

                  <p className="mt-2 text-xs text-slate-300">
                    {selectedLeague.country.name}
                    {currentSeason && ` · ${currentSeason.year} Season`}
                  </p>
                </div>

                <LeagueFavouriteButton
                  league={selectedLeague.league}
                  country={{ name: selectedLeague.country.name, flag: selectedLeague.country.flag }}
                  compact
                />
                <button
                  type="button"
                  onClick={() => setSelectedLeague(null)}
                  className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-red-400/40 hover:text-red-400"
                >
                  Close ×
                </button>
              </div>
            </div>

            {/* LEAGUE NAVIGATION */}
            <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className="text-sm font-black">
                  Competition Centre
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Explore league standings and upcoming matches.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView("standings")}
                  className={`rounded-lg px-4 py-3 text-xs font-black transition ${
                    activeView === "standings"
                      ? "bg-emerald-400 text-[#07130e]"
                      : "border border-white/10 bg-[#0e1721] text-slate-300 hover:border-emerald-400/40"
                  }`}
                >
                  League Table
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView("fixtures")}
                  className={`rounded-lg px-4 py-3 text-xs font-black transition ${
                    activeView === "fixtures"
                      ? "bg-emerald-400 text-[#07130e]"
                      : "border border-white/10 bg-[#0e1721] text-slate-300 hover:border-emerald-400/40"
                  }`}
                >
                  Fixtures
                </button>
              </div>
            </div>

            {/* STANDINGS */}
            {activeView === "standings" && (
              <div className="p-4 sm:p-6">

                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Competition Rankings
                  </p>

                  <h3 className="mt-2 text-xl font-black">
                    League Standings
                  </h3>
                </div>

                {standingsLoading && (
                  <div className="rounded-xl bg-[#0e1721] p-10 text-center">
                    <p className="text-sm text-slate-400">
                      Loading league standings...
                    </p>
                  </div>
                )}

                {!standingsLoading && standingsError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                    <p className="text-sm text-red-400">
                      {standingsError}
                    </p>
                  </div>
                )}

                {!standingsLoading &&
                  !standingsError &&
                  standings.length === 0 && (
                    <div className="rounded-xl bg-[#0e1721] p-8 text-center">
                      <p className="text-sm text-slate-400">
                        No standings information is currently available.
                      </p>
                    </div>
                  )}

                {!standingsLoading &&
                  !standingsError &&
                  standings.length > 0 && (
                    <StandingsTable groups={standings} />
                  )}

              </div>
            )}

            {/* FIXTURES */}
            {activeView === "fixtures" && (
              <div className="p-4 sm:p-6">

                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Match Schedule
                  </p>

                  <h3 className="mt-2 text-xl font-black">
                    Upcoming Fixtures
                  </h3>
                </div>

                {fixturesLoading && (
                  <div className="rounded-xl bg-[#0e1721] p-10 text-center">
                    <p className="text-sm text-slate-400">
                      Loading upcoming matches...
                    </p>
                  </div>
                )}

                {!fixturesLoading && fixturesError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                    <p className="text-sm text-red-400">
                      {fixturesError}
                    </p>
                  </div>
                )}

                {!fixturesLoading &&
                  !fixturesError &&
                  fixtures.length === 0 && (
                    <div className="rounded-xl bg-[#0e1721] p-8 text-center">
                      <p className="text-3xl">⚽</p>

                      <p className="mt-3 text-sm text-slate-400">
                        No upcoming matches are currently available for
                        this competition.
                      </p>
                    </div>
                  )}

                {!fixturesLoading &&
                  !fixturesError &&
                  fixtures.length > 0 && (
                    <div className="space-y-3">
                      {fixtures.map((match) => (
                        <FixtureCard
                          key={match.id}
                          match={match}
                        />
                      ))}
                    </div>
                  )}

              </div>
            )}

          </section>
        )}

        {/* FOOTER NAVIGATION */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            LiveScore by Cheke · Every sport. Every moment.
          </p>

          <a
            href="#competitions"
            className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
          >
            ↑ Back to Competitions
          </a>
        </div>

      </div>

      <Footer />
    </main>
  );
}