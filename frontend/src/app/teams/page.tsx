"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FootballTeam {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string | null;
    founded: number | null;
    national: boolean;
    logo: string;
  };

  venue: {
    name: string | null;
    city: string | null;
    capacity: number | null;
    image: string | null;
  };
}

interface TeamsResponse {
  success: boolean;
  teams: FootballTeam[];
  error?: string;
}

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState<FootballTeam[]>([]);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function searchTeams(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchTerm = search.trim();

    if (searchTerm.length < 3) {
      setError("Enter at least three characters to search.");
      setTeams([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setTeams([]);
      setSearched(false);

      const response = await fetch(
        `/api/football/teams?search=${encodeURIComponent(searchTerm)}`,
        {
          cache: "no-store",
        }
      );

      const data: TeamsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to retrieve football teams."
        );
      }

      setTeams(data.teams || []);
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
              Global Football Directory
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              Every Club.
              <span className="block text-green-400">
                Every Nation.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Explore the teams that shape the beautiful game.
              Discover clubs and national sides, find their home
              grounds, and get closer to football from around
              the world.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-slate-300">
                Club Teams
              </span>
              <span className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-slate-300">
                National Teams
              </span>
              <span className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-slate-300">
                Stadium Information
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                Team Explorer
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Find Your Team
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Search clubs and national teams from across the
                football world.
              </p>
            </div>

            <form
              onSubmit={searchTeams}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-500">
                  ⌕
                </span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search teams, e.g. Arsenal..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-green-500 px-7 py-4 font-bold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search Teams"}
              </button>
            </form>

            <p className="mt-3 text-xs text-slate-500">
              Enter at least three characters to search.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-slate-900 p-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                LiveScore by Cheke
              </span>

              <h3 className="mt-4 text-xl font-bold">
                The world of football, all in one place.
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                From historic clubs to international giants,
                discover the teams behind the game.
              </p>
            </div>

            <div className="mt-8 border-t border-slate-700/70 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Every sport. Every moment.
              </p>
            </div>
            <Link href="/team-compare" className="mt-5 inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20">
              ⚖ Compare two teams →
            </Link>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-20 text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-green-400" />

            <h3 className="text-lg font-bold">
              Searching the football world
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Finding teams that match your search...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
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

        {!loading && searched && !error && teams.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
              ⚽
            </div>

            <h3 className="text-xl font-bold">
              No Teams Found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              We couldn&apos;t find any teams matching your search.
              Try another team name or check your spelling.
            </p>
          </div>
        )}

        {!loading && teams.length > 0 && (
          <section>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                  Team Directory
                </p>

                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  Search Results
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Teams matching your search.
                </p>
              </div>

              <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-3">
                <span className="text-2xl font-black text-green-400">
                  {teams.length}
                </span>

                <span className="ml-2 text-sm text-slate-400">
                  {teams.length === 1 ? "Team Found" : "Teams Found"}
                </span>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {teams.map((item) => (
                <Link
                  href={`/team/${item.team.id}`}
                  key={item.team.id}
                  className="group block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-green-500/60 hover:shadow-xl hover:shadow-green-950/20"
                >
                  <div className="h-1 bg-gradient-to-r from-green-600 via-green-400 to-emerald-300 opacity-70 transition group-hover:opacity-100" />

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 p-3">
                        {item.team.logo ? (
                          <img
                            src={item.team.logo}
                            alt={`${item.team.name} logo`}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-2xl font-black text-green-400">
                            {item.team.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-bold leading-snug transition group-hover:text-green-400">
                          {item.team.name}
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                          {item.team.country || "Country unavailable"}
                        </p>

                        <div className="mt-3">
                          {item.team.national ? (
                            <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                              National Team
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                              Club Team
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="my-6 border-t border-slate-800" />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-800/60 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Team Code
                        </p>

                        <p className="mt-2 font-bold text-white">
                          {item.team.code || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-800/60 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Founded
                        </p>

                        <p className="mt-2 font-bold text-white">
                          {item.team.founded || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-green-400">
                          Home Ground
                        </p>

                        <span className="text-lg">⌂</span>
                      </div>

                      <p className="font-semibold text-white">
                        {item.venue.name || "Venue unavailable"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {item.venue.city || "City unavailable"}
                      </p>

                      {item.venue.capacity && (
                        <div className="mt-3 border-t border-slate-800 pt-3">
                          <p className="text-xs text-slate-500">
                            Stadium Capacity
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-300">
                            {item.venue.capacity.toLocaleString()} seats
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && !searched && !error && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-3xl">
              ⚽
            </div>

            <h3 className="text-xl font-bold">
              Discover Football Teams
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Your next favourite team is waiting to be discovered.
              Search for a club or national side to get started.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}