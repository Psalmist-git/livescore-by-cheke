"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export interface FavouriteLeague {
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
}

const STORAGE_KEY = "livescore-cheke-favourite-leagues";
const CHANGE_EVENT = "livescore:favourite-leagues-changed";

function readFavouriteLeagues(): FavouriteLeague[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FavouriteLeague =>
      Boolean(item && typeof item === "object" && "league" in item &&
        item.league && typeof item.league.id === "number" &&
        typeof item.league.name === "string")
    );
  } catch {
    return [];
  }
}

function saveGuestLeagues(items: FavouriteLeague[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Guest browsing remains available if browser storage is disabled.
  }
}

export function useFavouriteLeagues() {
  const [favourites, setFavourites] = useState<FavouriteLeague[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createClient> | null = null;
    let activeUserId: string | null = null;

    const showGuestFavourites = () => {
      if (!active) return;
      activeUserId = null;
      setUserId(null);
      setFavourites(readFavouriteLeagues());
      setLoaded(true);
    };

    const syncAccountFavourites = async (id: string) => {
      if (!supabase) return showGuestFavourites();
      const { data, error } = await supabase
        .from("favorite_leagues")
        .select("league_id, league_data")
        .eq("user_id", id);

      if (error || !active) {
        if (active) showGuestFavourites();
        return;
      }

      const cloudItems = (data ?? [])
        .map((row: { league_data: unknown }) => row.league_data as FavouriteLeague)
        .filter((item: FavouriteLeague) => item?.league && typeof item.league.id === "number");

      const guestItems = readFavouriteLeagues();
      const merged = new Map<number, FavouriteLeague>();
      cloudItems.forEach((item: FavouriteLeague) => merged.set(item.league.id, item));
      guestItems.forEach((item) => merged.set(item.league.id, item));

      const combined = [...merged.values()];
      if (guestItems.length) {
        await supabase.from("favorite_leagues").upsert(
          guestItems.map((item) => ({
            user_id: id,
            league_id: item.league.id,
            league_data: item,
          })),
          { onConflict: "user_id,league_id" }
        );
      }

      if (!active) return;
      activeUserId = id;
      setUserId(id);
      setFavourites(combined);
      setLoaded(true);
    };

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
        supabase = createClient();
      }
    } catch {
      // Supabase is optional for guests.
    }

    if (!supabase) {
      showGuestFavourites();
    } else {
      void supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
        if (!active) return;
        if (data.user) void syncAccountFavourites(data.user.id);
        else showGuestFavourites();
      }).catch(showGuestFavourites);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        window.setTimeout(() => {
          if (!active) return;
          if (session?.user) void syncAccountFavourites(session.user.id);
          else showGuestFavourites();
        }, 0);
      });

      const handleStorageChange = (event: StorageEvent) => {
        if (!activeUserId && (event.key === STORAGE_KEY || event.key === null)) {
          setFavourites(readFavouriteLeagues());
        }
      };
      const handleLocalChange = () => {
        if (!activeUserId) setFavourites(readFavouriteLeagues());
      };
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener(CHANGE_EVENT, handleLocalChange);
      return () => {
        active = false;
        subscription.unsubscribe();
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(CHANGE_EVENT, handleLocalChange);
      };
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setFavourites(readFavouriteLeagues());
    };
    const handleLocalChange = () => setFavourites(readFavouriteLeagues());
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(CHANGE_EVENT, handleLocalChange);
    return () => {
      active = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(CHANGE_EVENT, handleLocalChange);
    };
  }, []);

  async function addFavourite(league: FavouriteLeague) {
    const updated = favourites.some((item) => item.league.id === league.league.id)
      ? favourites
      : [...favourites, league];
    setFavourites(updated);

    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("favorite_leagues").upsert({
          user_id: userId,
          league_id: league.league.id,
          league_data: league,
        }, { onConflict: "user_id,league_id" });
      } catch {
        // Keep the UI responsive; the next session sync can retry.
      }
    } else {
      saveGuestLeagues(updated);
    }
  }

  async function removeFavourite(leagueId: number) {
    const updated = favourites.filter((item) => item.league.id !== leagueId);
    setFavourites(updated);

    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("favorite_leagues").delete()
          .eq("user_id", userId).eq("league_id", leagueId);
      } catch {
        // Keep the UI responsive; the next session sync can retry.
      }
    } else {
      saveGuestLeagues(updated);
    }
  }

  function isFavourite(leagueId: number) {
    return favourites.some((item) => item.league.id === leagueId);
  }

  return { favourites, loaded, addFavourite, removeFavourite, isFavourite };
}
