"use client";

import { useFavouriteLeagues, type FavouriteLeague } from "@/hooks/useFavouriteLeagues";

interface LeagueFavouriteButtonProps {
  league: FavouriteLeague["league"];
  country: FavouriteLeague["country"];
  compact?: boolean;
}

export default function LeagueFavouriteButton({
  league,
  country,
  compact = false,
}: LeagueFavouriteButtonProps) {
  const { loaded, isFavourite, addFavourite, removeFavourite } = useFavouriteLeagues();
  const saved = isFavourite(league.id);
  const item: FavouriteLeague = { league, country };

  return (
    <button
      type="button"
      disabled={!loaded}
      aria-pressed={saved}
      onClick={() => saved ? void removeFavourite(league.id) : void addFavourite(item)}
      className={compact
        ? "inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        : "inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
      }
    >
      <span aria-hidden="true">{saved ? "★" : "☆"}</span>
      {loaded ? (saved ? "Following" : "Follow League") : "Loading..."}
    </button>
  );
}
