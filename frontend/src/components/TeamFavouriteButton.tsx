"use client";

import { useFavourites, type FavouriteTeam } from "@/hooks/useFavourites";

interface TeamFavouriteButtonProps {
  team: FavouriteTeam["team"];
  venue?: Partial<FavouriteTeam["venue"]> | null;
  compact?: boolean;
}

export default function TeamFavouriteButton({
  team,
  venue,
  compact = false,
}: TeamFavouriteButtonProps) {
  const { loaded, isFavourite, addFavourite, removeFavourite } = useFavourites();
  const saved = isFavourite(team.id);

  const item: FavouriteTeam = {
    team,
    venue: {
      name: venue?.name ?? null,
      city: venue?.city ?? null,
      capacity: venue?.capacity ?? null,
      image: venue?.image ?? null,
    },
  };

  return (
    <button
      type="button"
      disabled={!loaded}
      aria-pressed={saved}
      onClick={() => saved ? void removeFavourite(team.id) : void addFavourite(item)}
      className={compact
        ? "inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        : "inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
      }
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
      {loaded ? (saved ? "Saved to Favourites" : "Add to Favourites") : "Loading..."}
    </button>
  );
}
