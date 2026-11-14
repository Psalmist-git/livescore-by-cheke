"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type PlayerSearchResult = {
  player: { id: number; name: string; photo?: string | null; nationality?: string | null };
};
type Stat = {
  games?: { appearences?: number | null; minutes?: number | null; lineups?: number | null };
  goals?: { total?: number | null; assists?: number | null };
  shots?: { total?: number | null };
  passes?: { total?: number | null; accuracy?: string | null };
  tackles?: { total?: number | null; interceptions?: number | null };
  duels?: { won?: number | null };
  dribbles?: { success?: number | null };
  cards?: { yellow?: number | null; red?: number | null };
};
type PlayerProfile = {
  player: { id: number; name: string; photo?: string | null; nationality?: string | null; age?: number | null };
  statistics: Stat[];
};
type SearchResponse = { success: boolean; players?: PlayerSearchResult[]; error?: string };
type ProfileResponse = { success: boolean; player: PlayerProfile | null; error?: string };
type Totals = {
  appearances: number; minutes: number; goals: number; assists: number;
  shots: number; passes: number; tackles: number; interceptions: number;
  duels: number; dribbles: number; yellow: number; red: number;
  passAccuracy: number | null;
};

const metricRows: { key: keyof Totals; label: string; higherIsBetter: boolean; suffix?: string }[] = [
  { key: "appearances", label: "Appearances", higherIsBetter: true },
  { key: "minutes", label: "Minutes played", higherIsBetter: true },
  { key: "goals", label: "Goals", higherIsBetter: true },
  { key: "assists", label: "Assists", higherIsBetter: true },
  { key: "shots", label: "Total shots", higherIsBetter: true },
  { key: "passes", label: "Passes", higherIsBetter: true },
  { key: "passAccuracy", label: "Pass accuracy", higherIsBetter: true, suffix: "%" },
  { key: "tackles", label: "Tackles", higherIsBetter: true },
  { key: "interceptions", label: "Interceptions", higherIsBetter: true },
  { key: "duels", label: "Duels won", higherIsBetter: true },
  { key: "dribbles", label: "Successful dribbles", higherIsBetter: true },
  { key: "yellow", label: "Yellow cards", higherIsBetter: false },
  { key: "red", label: "Red cards", higherIsBetter: false },
];

function aggregate(profile: PlayerProfile): Totals {
  const rows = profile.statistics ?? [];
  const sum = (get: (row: Stat) => number | null | undefined) =>
    rows.reduce((total, row) => total + (get(row) ?? 0), 0);
  const passRows = rows.filter((row) => row.passes?.accuracy != null && row.passes?.total);
  const passCount = passRows.reduce((n, row) => n + (row.passes?.total ?? 0), 0);
  const weightedAccuracy = passCount
    ? passRows.reduce((n, row) => n + Number(row.passes?.accuracy ?? 0) * (row.passes?.total ?? 0), 0) / passCount
    : null;
  return {
    appearances: sum((r) => r.games?.appearences),
    minutes: sum((r) => r.games?.minutes),
    goals: sum((r) => r.goals?.total),
    assists: sum((r) => r.goals?.assists),
    shots: sum((r) => r.shots?.total),
    passes: sum((r) => r.passes?.total),
    tackles: sum((r) => r.tackles?.total),
    interceptions: sum((r) => r.tackles?.interceptions),
    duels: sum((r) => r.duels?.won),
    dribbles: sum((r) => r.dribbles?.success),
    yellow: sum((r) => r.cards?.yellow),
    red: sum((r) => r.cards?.red),
    passAccuracy: weightedAccuracy === null ? null : Math.round(weightedAccuracy * 10) / 10,
  };
}

function PlayerPicker({
  title, selected, onSelect,
}: {
  title: string; selected: PlayerProfile | null; onSelect: (player: PlayerProfile | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 4) {
      setError("Enter at least four characters.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const response = await fetch(`/api/football/search?type=players&query=${encodeURIComponent(query.trim())}`);
      const payload: SearchResponse = await response.json();
      if (!response.ok || !payload.success) throw new Error("Unable to search players right now.");
      setResults(payload.players ?? []);
      if (!payload.players?.length) setError("No players found. Try another name.");
    } catch {
      setError("Unable to search players right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function choose(player: PlayerSearchResult["player"]) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/football/player?id=${player.id}&season=${new Date().getFullYear()}`);
      const payload: ProfileResponse = await response.json();
      if (!response.ok || !payload.success || !payload.player) {
        throw new Error("Unable to load this player's season statistics.");
      }
      onSelect(payload.player);
      setResults([]);
      setQuery(payload.player.player.name);
    } catch {
      setError("Unable to load this player's statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">{title}</p>
      {selected ? (
        <div className="mt-5 flex items-center gap-4">
          {selected.player.photo ? <img src={selected.player.photo} alt="" className="h-16 w-16 rounded-full bg-slate-800 object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 font-black text-emerald-400">{selected.player.name.slice(0, 2).toUpperCase()}</div>}
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-white">{selected.player.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{selected.player.nationality || "Nationality unavailable"}</p>
            <button type="button" onClick={() => { onSelect(null); setQuery(""); }} className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300">Change player</button>
          </div>
        </div>
      ) : (
        <form onSubmit={search} className="mt-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter player name..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
          <button disabled={loading} className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{loading ? "Loading..." : "Search players"}</button>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          {results.length > 0 && <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{results.map((item) => <button key={item.player.id} type="button" onClick={() => void choose(item.player)} className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-left hover:border-emerald-500">{item.player.photo ? <img src={item.player.photo} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold">{item.player.name.slice(0, 2).toUpperCase()}</span>}<span className="text-sm font-bold">{item.player.name}</span><span className="ml-auto text-xs text-emerald-400">Select →</span></button>)}</div>}
        </form>
      )}
    </section>
  );
}

function display(value: number | null, suffix = "") {
  return value === null ? "—" : `${value.toLocaleString()}${suffix}`;
}

export default function PlayerComparePage() {
  const [first, setFirst] = useState<PlayerProfile | null>(null);
  const [second, setSecond] = useState<PlayerProfile | null>(null);
  const firstTotals = first ? aggregate(first) : null;
  const secondTotals = second ? aggregate(second) : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <Link href="/search" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">← Back to search</Link>
        <div className="mt-7 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Player comparison</p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">Who leads the numbers?</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">Compare two players using their available current-season statistics. All figures come from the football data provider; unavailable values are shown as dashes.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <PlayerPicker title="Player one" selected={first} onSelect={setFirst} />
          <PlayerPicker title="Player two" selected={second} onSelect={setSecond} />
        </div>
        {first && second && firstTotals && secondTotals ? (
          <section className="mt-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-slate-800 p-4 sm:p-6">
              <div className="text-center">
                <Link href={`/player/${first.player.id}`} className="text-sm font-black transition hover:text-emerald-400 sm:text-lg">
                  {first.player.name}
                </Link>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Player 1</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-emerald-400">VS</span>
              <div className="text-center">
                <Link href={`/player/${second.player.id}`} className="text-sm font-black transition hover:text-emerald-400 sm:text-lg">
                  {second.player.name}
                </Link>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Player 2</p>
              </div>
            </div>
            <div className="divide-y divide-slate-800">
              {metricRows.map((metric) => {
                const a = firstTotals[metric.key], b = secondTotals[metric.key];
                const aWins = a !== null && b !== null && (metric.higherIsBetter ? a > b : a < b);
                const bWins = a !== null && b !== null && (metric.higherIsBetter ? b > a : b < a);
                return <div key={metric.key} className="grid grid-cols-[1fr_minmax(100px,1.2fr)_1fr] items-center gap-2 px-3 py-4 sm:px-6">
                  <p className={`text-center text-lg font-black sm:text-xl ${aWins ? "text-emerald-400" : "text-white"}`}>{display(a, metric.suffix)}</p>
                  <p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">{metric.label}</p>
                  <p className={`text-center text-lg font-black sm:text-xl ${bWins ? "text-emerald-400" : "text-white"}`}>{display(b, metric.suffix)}</p>
                </div>;
              })}
            </div>
            <p className="border-t border-slate-800 px-5 py-4 text-xs leading-5 text-slate-500">Higher values are highlighted for positive performance metrics. Lower card counts are highlighted. Passing accuracy is weighted by total passes. Comparisons may be affected by differences in position, competition and minutes played.</p>
          </section>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center">
            <p className="text-lg font-bold">Select two players to compare</p>
            <p className="mt-2 text-sm text-slate-400">Search each player above, then choose them from the results.</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
