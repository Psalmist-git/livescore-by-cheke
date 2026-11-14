"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export interface FavouriteTeam {
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

const STORAGE_KEY = "livescore-cheke-favourites";
const CHANGE_EVENT = "livescore:favourites-changed";

function readFavourites(): FavouriteTeam[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FavouriteTeam =>
      Boolean(item && typeof item === "object" && "team" in item &&
        item.team && typeof item.team.id === "number" &&
        typeof item.team.name === "string")
    );
  } catch {
    return [];
  }
}

function saveGuestFavourites(items: FavouriteTeam[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Guest browsing remains available if browser storage is disabled.
  }
}

export function useFavourites() {
  const [favourites, setFavourites] = useState<FavouriteTeam[]>([]);
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
      setFavourites(readFavourites());
      setLoaded(true);
    };

    const syncAccountFavourites = async (id: string) => {
      if (!supabase) return showGuestFavourites();
      const { data, error } = await supabase
        .from("favorite_teams")
        .select("team_id, team_data")
        .eq("user_id", id);

      if (error || !active) {
        if (active) showGuestFavourites();
        return;
      }

      const cloudItems = (data ?? [])
        .map((row: { team_data: unknown }) => row.team_data as FavouriteTeam)
        .filter((item: FavouriteTeam) => item?.team && typeof item.team.id === "number");

      const guestItems = readFavourites();
      const merged = new Map<number, FavouriteTeam>();
      cloudItems.forEach((item: FavouriteTeam) => merged.set(item.team.id, item));
      guestItems.forEach((item) => merged.set(item.team.id, item));

      const combined = [...merged.values()];
      if (guestItems.length) {
        const { error: saveError } = await supabase
          .from("favorite_teams")
          .upsert(
            guestItems.map((item) => ({
              user_id: id,
              team_id: item.team.id,
              team_data: item,
            })),
            { onConflict: "user_id,team_id" }
          );
        if (saveError) {
          // Keep local guest data visible; retry on a later session refresh.
        }
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
          setFavourites(readFavourites());
        }
      };
      const handleLocalChange = () => {
        if (!activeUserId) setFavourites(readFavourites());
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
      if (event.key === STORAGE_KEY || event.key === null) setFavourites(readFavourites());
    };
    const handleLocalChange = () => setFavourites(readFavourites());
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(CHANGE_EVENT, handleLocalChange);
    return () => {
      active = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(CHANGE_EVENT, handleLocalChange);
    };
  }, []);

  async function addFavourite(team: FavouriteTeam) {
    const updated = favourites.some((item) => item.team.id === team.team.id)
      ? favourites
      : [...favourites, team];
    setFavourites(updated);

    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("favorite_teams").upsert({
          user_id: userId,
          team_id: team.team.id,
          team_data: team,
        }, { onConflict: "user_id,team_id" });
      } catch {
        // Keep the UI responsive; the next session sync can retry.
      }
    } else {
      saveGuestFavourites(updated);
    }
  }

  async function removeFavourite(teamId: number) {
    const updated = favourites.filter((item) => item.team.id !== teamId);
    setFavourites(updated);

    if (userId) {
      try {
        const supabase = createClient();
        await supabase.from("favorite_teams").delete()
          .eq("user_id", userId).eq("team_id", teamId);
      } catch {
        // Keep the UI responsive; the next session sync can retry.
      }
    } else {
      saveGuestFavourites(updated);
    }
  }

  function isFavourite(teamId: number) {
    return favourites.some((item) => item.team.id === teamId);
  }

  return { favourites, loaded, addFavourite, removeFavourite, isFavourite };
}
