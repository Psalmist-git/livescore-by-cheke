"use client";

import Link from "next/link";
import { useFavouriteLeagues } from "@/hooks/useFavouriteLeagues";

export default function FollowedLeaguesPanel() {
  const { favourites, loaded, removeFavourite } = useFavouriteLeagues();

  if (!loaded || favourites.length === 0) return null;

  return (
    <section
      id="followed-competitions"
      className="mt-8 rounded-2xl border border-emerald-500/20 bg-[#141e29] p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
            Your personal list
          </p>
          <h2 className="mt-1 text-xl font-black text-white">
            Followed Competitions
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Saved on this device or synced to your account.
          </p>
        </div>
        <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300">
          {favourites.length} followed
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {favourites.map((item) => (
          <article
            key={item.league.id}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#0c151e] p-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 p-2">
              {item.league.logo ? (
                <img src={item.league.logo} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <span aria-hidden="true">🏆</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/leagues?league=${item.league.id}`}
                className="block truncate text-sm font-bold text-white transition hover:text-emerald-300"
              >
                {item.league.name}
              </Link>
              <p className="mt-1 truncate text-xs text-slate-500">{item.country.name}</p>
            </div>
            <button
              type="button"
              onClick={() => void removeFavourite(item.league.id)}
              aria-label={`Unfollow ${item.league.name}`}
              className="shrink-0 rounded-lg border border-red-500/20 px-2.5 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
            >
              ×
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
