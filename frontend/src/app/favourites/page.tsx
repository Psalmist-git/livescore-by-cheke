"use client";

import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useFavourites } from "@/hooks/useFavourites";
import FavouriteTeamFixtures from "@/components/FavouriteTeamFixtures";

export default function FavouritesPage() {
  const {
    favourites,
    loaded,
    removeFavourite,
  } = useFavourites();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />

      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40">
        <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              <span className="text-base">♥</span>
              Your Personal Collection
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              Your Teams.
              <span className="block text-green-400">
                Your Passion.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Keep the clubs and national teams you love close.
              Your personal football collection, all in one place.
            </p>

            {loaded && (
              <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3">
                <span className="text-2xl font-black text-green-400">
                  {favourites.length}
                </span>

                <span className="text-sm text-slate-400">
                  {favourites.length === 1
                    ? "Team in your collection"
                    : "Teams in your collection"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {!loaded && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-20 text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-green-400" />

            <h2 className="text-lg font-bold">
              Loading Your Collection
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Getting your favourite teams ready...
            </p>
          </div>
        )}

        {loaded && favourites.length === 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-500/5 blur-3xl" />

            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-4xl text-green-400">
              ♡
            </div>

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                Your Collection Starts Here
              </p>

              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                No Favourite Teams Yet
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
                You haven&apos;t saved any teams yet. Explore the
                football directory and add your favourite clubs
                or national teams to build your personal collection.
              </p>

              <Link
                href="/teams"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-7 py-4 font-bold text-slate-950 transition hover:bg-green-400"
              >
                Explore Teams
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}

        {loaded && favourites.length > 0 && (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                  Saved Collection
                </p>

                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  My Favourite Teams
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  The teams you follow and support.
                </p>
              </div>

              <Link
                href="/teams"
                className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-green-500 hover:text-green-400"
              >
                + Add More Teams
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {favourites.map((item, index) => (
                <article
                  key={item.team.id}
                  className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-green-500/60 hover:shadow-xl hover:shadow-green-950/20"
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
                        <h3 className="break-words text-lg font-bold leading-snug">
                          <Link
                            href={`/team/${item.team.id}`}
                            className="transition-colors hover:text-green-400 focus-visible:text-green-400"
                          >
                            {item.team.name}
                          </Link>
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
                    </div>

                    {index < 6 ? (
                      <FavouriteTeamFixtures teamId={item.team.id} teamName={item.team.name} />
                    ) : (
                      <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-500">
                        Fixture snapshots are shown for your first six saved teams to keep data requests efficient.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => removeFavourite(item.team.id)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition hover:border-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <span aria-hidden="true">♡</span>
                      Remove from Favourites
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}