"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveMatchCard from "@/components/LiveMatchCard";
import FixtureCard from "@/components/FixtureCard";
import NewsFeed from "@/components/NewsFeed";
import YouTubeHighlights from "@/components/YouTubeHighlights";
import DateFixtureBrowser from "@/components/DateFixtureBrowser";
import PopularCompetitions from "@/components/PopularCompetitions";
import { useFavourites } from "@/hooks/useFavourites";
import { useFavouriteLeagues } from "@/hooks/useFavouriteLeagues";

import type { Match } from "@/types/football";

interface ApiLiveFixture {
  fixture: {
    id: number;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    name: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      code: string | null;
      logo?: string;
    };
    away: {
      id: number;
      name: string;
      code: string | null;
      logo?: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface ApiUpcomingFixture {
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

interface ApiResponse<T> {
  success?: boolean;
  matches?: T[];
  error?: unknown;
}

function getErrorMessage(_error: unknown): string {
  return "Unable to load data right now. Please try again later.";
}

function formatKickoff(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

export default function HomePage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);

  const [liveLoading, setLiveLoading] = useState(true);
  const [fixturesLoading, setFixturesLoading] = useState(true);

  const [liveError, setLiveError] = useState("");
  const [fixturesError, setFixturesError] = useState("");
  const liveRequestInFlight = useRef(false);
  const fixturesRequestInFlight = useRef(false);

  const { favourites, loaded: favouritesLoaded } = useFavourites();
  const { favourites: followedLeagues, loaded: followedLeaguesLoaded } = useFavouriteLeagues();
  const favouriteNames = new Set(
    favourites.map((item) => item.team.name.toLowerCase())
  );
  const isFavouriteMatch = (match: Match) =>
    favouriteNames.has(match.homeTeam.name.toLowerCase()) ||
    favouriteNames.has(match.awayTeam.name.toLowerCase());
  const prioritisedLiveMatches = [...liveMatches].sort(
    (a, b) => Number(isFavouriteMatch(b)) - Number(isFavouriteMatch(a))
  );
  const prioritisedUpcomingMatches = [...upcomingMatches].sort(
    (a, b) => Number(isFavouriteMatch(b)) - Number(isFavouriteMatch(a))
  );

  const loadLiveMatches = useCallback(async (silent = false) => {
    if (liveRequestInFlight.current) return;
    liveRequestInFlight.current = true;

    try {
      if (!silent) {
        setLiveLoading(true);
        setLiveError("");
      }

      const response = await fetch("/api/football/live", {
        cache: "no-store",
      });

      const data: ApiResponse<ApiLiveFixture> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(getErrorMessage(data.error));
      }

      const formattedMatches: Match[] = (data.matches || []).map((item) => ({
        id: item.fixture.id,
        league: item.league.name,
        status: "LIVE",
        minute:
          item.fixture.status.elapsed !== null
            ? `${item.fixture.status.elapsed}'`
            : item.fixture.status.short,
        homeTeam: {
          id: item.teams.home.id,
          name: item.teams.home.name,
          shortName:
            item.teams.home.code ||
            item.teams.home.name.slice(0, 3).toUpperCase(),
          logo: item.teams.home.logo,
        },
        awayTeam: {
          id: item.teams.away.id,
          name: item.teams.away.name,
          shortName:
            item.teams.away.code ||
            item.teams.away.name.slice(0, 3).toUpperCase(),
          logo: item.teams.away.logo,
        },
        homeScore: item.goals.home,
        awayScore: item.goals.away,
      }));

      setLiveMatches(formattedMatches);
      setLiveError("");
    } catch (error) {
      if (!silent) {
        setLiveError("Unable to load data right now. Please try again later.");
      }
    } finally {
      liveRequestInFlight.current = false;
      if (!silent) setLiveLoading(false);
    }
  }, []);

  const loadUpcomingMatches = useCallback(async (silent = false) => {
    if (fixturesRequestInFlight.current) return;
    fixturesRequestInFlight.current = true;

    try {
      if (!silent) {
        setFixturesLoading(true);
        setFixturesError("");
      }

      const response = await fetch("/api/football/fixtures", {
        cache: "no-store",
      });

      const data: ApiResponse<ApiUpcomingFixture> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(getErrorMessage(data.error));
      }

      const formattedMatches: Match[] = (data.matches || []).map((item) => ({
        id: item.fixture.id,
        league: item.league.name,
        status: "UPCOMING",
        kickoff: formatKickoff(item.fixture.date),
        homeTeam: {
          id: item.teams.home.id,
          name: item.teams.home.name,
          shortName:
            item.teams.home.code ||
            item.teams.home.name.slice(0, 3).toUpperCase(),
          logo: item.teams.home.logo,
        },
        awayTeam: {
          id: item.teams.away.id,
          name: item.teams.away.name,
          shortName:
            item.teams.away.code ||
            item.teams.away.name.slice(0, 3).toUpperCase(),
          logo: item.teams.away.logo,
        },
        homeScore: null,
        awayScore: null,
      }));

      setUpcomingMatches(formattedMatches);
      setFixturesError("");
    } catch (error) {
      if (!silent) {
        setFixturesError("Unable to load data right now. Please try again later.");
      }
    } finally {
      fixturesRequestInFlight.current = false;
      if (!silent) setFixturesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLiveMatches();
    void loadUpcomingMatches();

    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      void loadLiveMatches(true);
      void loadUpcomingMatches(true);
    };

    const interval = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadLiveMatches, loadUpcomingMatches]);

  return (
    <main className="min-h-screen bg-[#0b1118] text-white">
      <Header />

      <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5 lg:px-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">

          {/* DYNAMIC COMPETITIONS */}
          <aside className="hidden lg:block">
            <PopularCompetitions />
          </aside>

          {/* CENTRE CONTENT */}
          <div className="min-w-0 space-y-6">

            {/* WELCOME BANNER */}
            <section className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-[#123528] via-[#142b2b] to-[#141e29] p-5 sm:p-7">
              <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[35px] border-emerald-400/[0.04]" />
              <div className="pointer-events-none absolute -bottom-28 right-24 h-64 w-64 rounded-full border-[30px] border-emerald-400/[0.04]" />

              <div className="relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Football Coverage
                </div>

                <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  Every Match.
                  <br />
                  Every Goal.
                  <span className="block text-emerald-400">
                    Every Moment.
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                  Your football world, all in one place. Follow live scores,
                  upcoming fixtures, competitions and the latest football news.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/live"
                    className="rounded-lg bg-emerald-400 px-5 py-3 text-xs font-black text-[#07130e] transition hover:bg-emerald-300"
                  >
                    Explore Live Scores →
                  </Link>

                  <Link
                    href="/fixtures"
                    className="rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-bold text-white transition hover:border-emerald-400/50"
                  >
                    View Fixtures
                  </Link>
                </div>
              </div>
            </section>

            {/* DASHBOARD STATISTICS */}
            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-[#141e29] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Live Matches
                </div>
                <p className="mt-3 text-3xl font-black text-white">
                  {liveLoading ? "..." : liveError ? "—" : liveMatches.length}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Currently in progress
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#141e29] p-4 sm:p-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Today&apos;s Fixtures
                </div>
                <p className="mt-3 text-3xl font-black text-emerald-400">
                  {fixturesLoading
                    ? "..."
                    : fixturesError
                      ? "—"
                      : upcomingMatches.length}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Scheduled matches
                </p>
              </div>
            </section>

            <DateFixtureBrowser />

            {favouritesLoaded && favourites.length > 0 && (
              <section className="overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-[#102a22] to-[#141e29] p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">Personalised for you</p>
                    <h2 className="mt-1 text-lg font-black text-white">Your Favourite Teams</h2>
                    <p className="mt-1 text-xs text-slate-400">Matches featuring these teams appear first in the live and upcoming lists.</p>
                  </div>
                  <Link href="/favourites" className="rounded-lg border border-emerald-400/20 px-3 py-2 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-400/10">Manage teams →</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favourites.slice(0, 10).map((item) => (
                    <Link key={item.team.id} href="/favourites" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/40">
                      {item.team.logo && <img src={item.team.logo} alt="" className="h-5 w-5 object-contain" />}
                      {item.team.name}
                    </Link>
                  ))}
                  {favourites.length > 10 && <span className="self-center text-[10px] text-slate-500">+{favourites.length - 10} more</span>}
                </div>
              </section>
            )}

            {followedLeaguesLoaded && followedLeagues.length > 0 && (
              <section className="rounded-xl border border-emerald-500/20 bg-[#141e29] p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">Your competitions</p>
                    <h2 className="mt-1 text-base font-black text-white">Followed Leagues & Cups</h2>
                  </div>
                  <Link href="/search" className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">Find more →</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {followedLeagues.slice(0, 10).map((item) => (
                    <Link key={item.league.id} href={`/leagues?league=${item.league.id}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/40">
                      {item.league.logo && <img src={item.league.logo} alt="" className="h-5 w-5 object-contain" />}
                      {item.league.name}
                    </Link>
                  ))}
                  {followedLeagues.length > 10 && <span className="self-center text-[10px] text-slate-500">+{followedLeagues.length - 10} more</span>}
                </div>
              </section>
            )}

            {/* LIVE MATCHES */}
            <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#141e29]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-4 sm:p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-400">
                      Happening Now
                    </p>
                  </div>
                  <h2 className="mt-2 text-xl font-black sm:text-2xl">
                    Live Matches
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadLiveMatches()}
                    disabled={liveLoading}
                    className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 transition hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-50"
                  >
                    {liveLoading ? "Loading..." : "↻ Refresh"}
                  </button>

                  <Link
                    href="/live"
                    className="rounded-lg bg-emerald-400 px-3 py-2 text-[10px] font-black text-[#07130e] transition hover:bg-emerald-300"
                  >
                    View All →
                  </Link>
                </div>
              </div>

              <div className="space-y-3 p-3 sm:p-4">
                {liveLoading && (
                  <div className="rounded-lg bg-[#0e1721] p-8 text-center text-sm text-slate-400">
                    Loading live football scores...
                  </div>
                )}

                {!liveLoading && liveError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
                    <p className="text-sm font-bold text-red-400">
                      Unable to load live matches
                    </p>
                    <p className="mt-2 break-words text-xs text-slate-400">
                      {liveError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadLiveMatches()}
                      className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!liveLoading && !liveError && liveMatches.length === 0 && (
                  <div className="rounded-lg bg-[#0e1721] p-8 text-center">
                    <p className="text-3xl">⚽</p>
                    <h3 className="mt-3 text-sm font-bold">
                      No Live Matches Right Now
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      Check back when the next games begin.
                    </p>
                  </div>
                )}

                {!liveLoading && !liveError && liveMatches.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {prioritisedLiveMatches.slice(0, 6).map((match) => (
                      <LiveMatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* UPCOMING FIXTURES */}
            <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#141e29]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-4 sm:p-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
                    Coming Up
                  </p>
                  <h2 className="mt-2 text-xl font-black sm:text-2xl">
                    Today&apos;s Fixtures
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadUpcomingMatches()}
                    disabled={fixturesLoading}
                    className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-300 transition hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-50"
                  >
                    {fixturesLoading ? "Loading..." : "↻ Refresh"}
                  </button>

                  <Link
                    href="/fixtures"
                    className="rounded-lg bg-emerald-400 px-3 py-2 text-[10px] font-black text-[#07130e] transition hover:bg-emerald-300"
                  >
                    All Fixtures →
                  </Link>
                </div>
              </div>

              {fixturesLoading && (
                <div className="p-8 text-center text-sm text-slate-400">
                  Loading today&apos;s fixtures...
                </div>
              )}

              {!fixturesLoading && fixturesError && (
                <div className="p-5">
                  <p className="text-sm font-bold text-red-400">
                    Unable to load fixtures
                  </p>
                  <p className="mt-2 break-words text-xs text-slate-400">
                    {fixturesError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadUpcomingMatches()}
                    className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!fixturesLoading &&
                !fixturesError &&
                upcomingMatches.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-3xl">📅</p>
                    <h3 className="mt-3 text-sm font-bold">
                      No Upcoming Fixtures
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      No scheduled matches are currently available for today.
                    </p>
                  </div>
                )}

              {!fixturesLoading &&
                !fixturesError &&
                upcomingMatches.length > 0 && (
                  <div>
                    {prioritisedUpcomingMatches.slice(0, 8).map((match) => (
                      <FixtureCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
            </section>

            {/* DISCOVER MORE */}
            <section className="grid grid-cols-2 gap-3">
              <Link
                href="/teams"
                className="rounded-xl border border-white/[0.07] bg-[#141e29] p-4 transition hover:border-emerald-500/40"
              >
                <span className="text-2xl">⚽</span>
                <h3 className="mt-3 text-sm font-bold">Explore Teams</h3>
                <p className="mt-1 text-[10px] leading-5 text-slate-500">
                  Discover clubs and national teams.
                </p>
              </Link>

              <Link
                href="/leagues"
                className="rounded-xl border border-white/[0.07] bg-[#141e29] p-4 transition hover:border-emerald-500/40"
              >
                <span className="text-2xl">🏆</span>
                <h3 className="mt-3 text-sm font-bold">Explore Leagues</h3>
                <p className="mt-1 text-[10px] leading-5 text-slate-500">
                  Follow competitions and standings.
                </p>
              </Link>
            </section>
          </div>

        </div>
      </div>

      <section className="mx-auto max-w-[1600px] px-3 pb-10 sm:px-5 lg:px-6">
        <NewsFeed />
        <div className="mt-8">
          <YouTubeHighlights kind="all" limit={6} />
        </div>
      </section>
      <Footer />
    </main>
  );
}