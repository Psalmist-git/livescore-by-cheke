"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Stat = {
  team?: { id: number; name: string; logo: string };
  league?: { id: number; name: string; country: string; logo: string; season: number };
  games?: { appearences?: number | null; lineups?: number | null; minutes?: number | null; position?: string | null; rating?: string | null; captain?: boolean };
  substitutes?: { in?: number | null; out?: number | null; bench?: number | null };
  shots?: { total?: number | null; on?: number | null };
  goals?: { total?: number | null; assists?: number | null; saves?: number | null; conceded?: number | null };
  passes?: { total?: number | null; key?: number | null; accuracy?: string | null };
  tackles?: { total?: number | null; blocks?: number | null; interceptions?: number | null };
  duels?: { total?: number | null; won?: number | null };
  dribbles?: { attempts?: number | null; success?: number | null; past?: number | null };
  fouls?: { drawn?: number | null; committed?: number | null };
  cards?: { yellow?: number | null; yellowred?: number | null; red?: number | null };
  penalty?: { scored?: number | null; missed?: number | null; saved?: number | null };
};

type Player = {
  player: {
    id: number; name: string; firstname?: string | null; lastname?: string | null;
    age?: number | null; nationality?: string | null; height?: string | null;
    weight?: string | null; photo?: string | null; injured?: boolean;
    birth?: { date?: string | null; place?: string | null; country?: string | null };
  };
  statistics: Stat[];
};

type ProfileResponse = { success: boolean; error?: string; season?: string; player: Player | null };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PlayerProfileContent() {
  const params = useParams<{ id: string }>();
  const playerId = params.id;
  const season = useMemo(() => String(new Date().getFullYear()), []);
  const [data, setData] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/football/player?id=${encodeURIComponent(playerId)}&season=${season}`,
          { cache: "no-store" }
        );
        const result: ProfileResponse = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load data right now. Please try again later.");
        }
        if (!cancelled) setData(result.player);
      } catch {
        if (!cancelled) setError("Unable to load data right now. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (playerId && /^\d+$/.test(playerId)) void load();
    else { setError("This player profile link is invalid."); setLoading(false); }
    return () => { cancelled = true; };
  }, [playerId, season]);

  const stats = data?.statistics ?? [];
  const totals = stats.reduce((total, item) => ({
    appearances: total.appearances + (item.games?.appearences ?? 0),
    minutes: total.minutes + (item.games?.minutes ?? 0),
    goals: total.goals + (item.goals?.total ?? 0),
    assists: total.assists + (item.goals?.assists ?? 0),
    yellow: total.yellow + (item.cards?.yellow ?? 0),
    red: total.red + (item.cards?.red ?? 0),
  }), { appearances: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0 });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <Link href="/search" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">← Back to search</Link>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 py-24 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400" />
            <p className="text-sm text-slate-400">Loading player profile...</p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-sm text-red-300">{error}</div>
        ) : !data ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h1 className="text-xl font-black">Player statistics unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">No profile or season statistics were returned for this player in {season}. This may be because the player has no recorded appearances in the selected season.</p>
          </div>
        ) : (
          <>
            <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50">
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-10">
                {data.player.photo ? <img src={data.player.photo} alt={data.player.name} className="h-32 w-32 rounded-2xl border border-white/10 bg-slate-800 object-cover sm:h-40 sm:w-40" /> : <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-slate-800 text-3xl font-black text-emerald-400">{data.player.name.slice(0,2).toUpperCase()}</div>}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Player profile · {season} season</p>
                  <h1 className="mt-3 text-3xl font-black sm:text-5xl">{data.player.name}</h1>
                  <p className="mt-3 text-sm text-slate-300">{[data.player.nationality, data.player.age ? `${data.player.age} years old` : null, stats[0]?.games?.position].filter(Boolean).join(" · ") || "Player details"}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
                    {data.player.height && <span className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">Height: {data.player.height}</span>}
                    {data.player.weight && <span className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2">Weight: {data.player.weight}</span>}
                    {data.player.injured && <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300">Reported injured</span>}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Season overview</p><h2 className="mt-1 text-2xl font-black">Performance</h2></div>
                <span className="text-xs text-slate-500">{season}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Appearances" value={totals.appearances} />
                <StatCard label="Minutes" value={totals.minutes.toLocaleString()} />
                <StatCard label="Goals" value={totals.goals} />
                <StatCard label="Assists" value={totals.assists} />
                <StatCard label="Yellow cards" value={totals.yellow} />
                <StatCard label="Red cards" value={totals.red} />
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Competition breakdown</p><h2 className="mt-1 text-2xl font-black">Season statistics by team & league</h2></div>
              {stats.length === 0 ? <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No season statistics are available for this player yet.</p> : <div className="space-y-4">{stats.map((item, index) => <article key={`${item.team?.id ?? "team"}-${item.league?.id ?? index}`} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
                  {item.team?.logo && <img src={item.team.logo} alt="" className="h-9 w-9 object-contain" />}
                  <div className="min-w-0 flex-1"><h3 className="font-bold">{item.team?.id ? <Link href={`/team/${item.team.id}`} className="transition-colors hover:text-emerald-400 focus-visible:text-emerald-400">{item.team.name}</Link> : item.team?.name || "Team unavailable"}</h3><p className="mt-1 text-xs text-slate-400">{item.league?.name || "Competition unavailable"}{item.league?.country ? ` · ${item.league.country}` : ""}</p></div>
                  {item.games?.rating && <span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-black text-emerald-300">Rating {Number(item.games.rating).toFixed(2)}</span>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  <StatCard label="Appearances" value={item.games?.appearences ?? "—"} />
                  <StatCard label="Starts" value={item.games?.lineups ?? "—"} />
                  <StatCard label="Goals" value={item.goals?.total ?? "—"} />
                  <StatCard label="Assists" value={item.goals?.assists ?? "—"} />
                  <StatCard label="Shots" value={item.shots?.total ?? "—"} />
                  <StatCard label="Pass accuracy" value={item.passes?.accuracy ? `${item.passes.accuracy}%` : "—"} />
                  <StatCard label="Tackles" value={item.tackles?.total ?? "—"} />
                  <StatCard label="Interceptions" value={item.tackles?.interceptions ?? "—"} />
                  <StatCard label="Duels won" value={item.duels?.won ?? "—"} />
                  <StatCard label="Dribbles" value={item.dribbles?.success ?? "—"} />
                  <StatCard label="Yellow cards" value={item.cards?.yellow ?? "—"} />
                  <StatCard label="Red cards" value={item.cards?.red ?? "—"} />
                </div>
              </article>)}</div>}
            </section>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}


export default function PlayerProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-white">
          <Header />
          <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-slate-400">
            Loading player profile...
          </div>
          <Footer />
        </main>
      }
    >
      <PlayerProfileContent />
    </Suspense>
  );
}
