"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import Header from "@/components/Header";
import LiveMatchCard from "@/components/LiveMatchCard";
import Footer from "@/components/Footer";

import type { Match } from "@/types/football";

interface ApiFootballFixture {
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

interface LiveApiResponse {
  success?: boolean;
  matches?: ApiFootballFixture[];
  error?: unknown;
}

export default function LiveScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshInFlight = useRef(false);

  const loadMatches = useCallback(async (silent = false) => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;

    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await fetch("/api/football/live", {
        cache: "no-store",
      });

      const data: LiveApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error) || "Unable to load live matches."
        );
      }

      const apiMatches = data.matches ?? [];

      const formattedMatches: Match[] = apiMatches.map((item) => ({
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

      setMatches(formattedMatches);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading matches."
        );
      }
    } finally {
      refreshInFlight.current = false;
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMatches();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadMatches(true);
      }
    };

    const interval = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadMatches]);

  const competitions = [...new Set(matches.map((match) => match.league))];

  return (
    <main className="min-h-screen bg-[#0b1118] text-white">
      <Header />

      <div className="mx-auto max-w-[1500px] px-3 py-6 sm:px-5 sm:py-9 lg:px-6">

        {/* PAGE BANNER */}
        <section className="relative overflow-hidden rounded-2xl border border-red-500/15 bg-gradient-to-br from-[#351c25] via-[#20202b] to-[#141e29] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-red-400/[0.04]" />

          <div className="relative z-10 flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-red-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Live Sports Centre
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                Live Football Scores
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Follow ongoing football matches, track every goal and stay
                connected to competitions around the world.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/fixtures"
                  className="rounded-lg bg-emerald-400 px-5 py-3 text-xs font-black text-[#07130e] transition hover:bg-emerald-300"
                >
                  Upcoming Fixtures →
                </Link>

                <Link
                  href="/leagues"
                  className="rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-bold text-white transition hover:border-emerald-400/50"
                >
                  Explore Competitions
                </Link>
              </div>
            </div>

            <div className="w-full rounded-xl border border-white/10 bg-black/20 p-5 md:w-52">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Live Now
              </div>

              <p className="mt-3 text-5xl font-black">
                {loading && matches.length === 0 ? "..." : error ? "—" : matches.length}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Matches in progress
              </p>
            </div>
          </div>
        </section>

        {/* MATCH SUMMARY */}
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.07] bg-[#141e29] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Live Matches
            </p>
            <p className="mt-2 text-2xl font-black text-red-400">
              {loading && matches.length === 0 ? "..." : error ? "—" : matches.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#141e29] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Competitions
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-400">
              {loading && matches.length === 0 ? "..." : error ? "—" : competitions.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#141e29] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Last Updated
            </p>
            <p className="mt-2 text-lg font-black text-white">
              {lastUpdated
                ? lastUpdated.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Awaiting data"}
            </p>
          </div>
        </section>

        {/* LIVE MATCH LIST */}
        <section className="mt-8 overflow-hidden rounded-xl border border-white/[0.07] bg-[#141e29]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] p-4 sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-400">
                  Happening Right Now
                </p>
              </div>

              <h2 className="mt-2 text-xl font-black sm:text-2xl">
                Matches in Progress
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Live scores from football competitions worldwide.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadMatches()}
              disabled={loading || isRefreshing}
              className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs font-black text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Loading Scores..." : isRefreshing ? "Updating Scores..." : "↻ Refresh Scores"}
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {lastUpdated && (
              <p className="mb-5 text-[10px] text-slate-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}

            {loading && matches.length === 0 && (
              <div className="rounded-xl bg-[#0e1721] p-10 text-center">
                <p className="text-sm text-slate-400">
                  Loading live football scores...
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
                <h3 className="font-bold text-red-400">
                  Unable to load live scores
                </h3>

                <p className="mt-2 break-words text-sm text-slate-300">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => void loadMatches()}
                  className="mt-4 rounded-lg bg-red-500 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-400"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && matches.length === 0 && (
              <div className="rounded-xl bg-[#0e1721] p-10 text-center">
                <p className="text-4xl">⚽</p>

                <h3 className="mt-4 text-lg font-black">
                  No Live Matches Right Now
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  There are currently no live matches available. Check again
                  when the next games begin.
                </p>

                <button
                  type="button"
                  onClick={() => void loadMatches()}
                  className="mt-5 rounded-lg border border-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
                >
                  Check Again
                </button>
              </div>
            )}

            {matches.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {matches.map((match) => (
                  <LiveMatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* COMPETITIONS */}
        {competitions.length > 0 && (
          <section className="mt-6 rounded-xl border border-white/[0.07] bg-[#141e29] p-5 sm:p-6">
            <h2 className="text-sm font-black">Competitions Currently Active</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {competitions.map((competition) => (
                <span
                  key={competition}
                  className="rounded-lg border border-white/[0.07] bg-[#0e1721] px-3 py-2 text-xs font-semibold text-slate-300"
                >
                  {competition}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* BACK NAVIGATION */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            LiveScore by Cheke · Every sport. Every moment.
          </p>

          <Link
            href="/"
            className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}