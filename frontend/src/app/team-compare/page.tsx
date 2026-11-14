"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Team = { team: { id: number; name: string; logo: string; country: string | null } };
type TeamSummary = {
  team: { id: number; name: string; logo: string };
  matchesPlayed: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number;
  cleanSheets: number; averageGoalsFor: number; averageGoalsAgainst: number;
  form: { id: number; date: string; opponent: string; goalsFor: number; goalsAgainst: number; result: "W" | "D" | "L" }[];
};
type SearchPayload = { success: boolean; teams?: Team[]; error?: string };
type HeadToHeadMatch = {
  id: number; date: string; homeId: number; awayId: number; home: string; away: string;
  homeLogo: string; awayLogo: string; homeGoals: number | null;
  awayGoals: number | null; competition: string;
};
type ComparePayload = {
  success: boolean; home?: TeamSummary; away?: TeamSummary;
  headToHead?: HeadToHeadMatch[]; error?: string;
};

function TeamPicker({ title, selected, onSelect }: {
  title: string; selected: Team["team"] | null; onSelect: (team: Team["team"] | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 3) { setError("Enter at least three characters."); return; }
    setLoading(true); setError(""); setResults([]);
    try {
      const response = await fetch(`/api/football/teams?search=${encodeURIComponent(query.trim())}`);
      const payload: SearchPayload = await response.json();
      if (!response.ok || !payload.success) throw new Error("Unable to search teams right now.");
      setResults(payload.teams ?? []);
      if (!payload.teams?.length) setError("No teams found. Try another name.");
    } catch { setError("Unable to search teams right now. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">{title}</p>
      {selected ? (
        <div className="mt-5 flex items-center gap-4">
          {selected.logo ? <img src={selected.logo} alt="" className="h-14 w-14 object-contain" /> : <div className="h-14 w-14 rounded-xl bg-slate-800" />}
          <div className="min-w-0 flex-1"><h2 className="font-black">{selected.name}</h2><p className="mt-1 text-xs text-slate-400">{selected.country || "Team selected"}</p>
            <button type="button" onClick={() => { onSelect(null); setQuery(""); }} className="mt-2 text-xs font-bold text-emerald-400">Change team</button>
          </div>
        </div>
      ) : (
        <form onSubmit={search} className="mt-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search club or national team..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
          <button disabled={loading} className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{loading ? "Searching..." : "Search teams"}</button>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          {results.length > 0 && <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{results.map((item) => <button key={item.team.id} type="button" onClick={() => { onSelect(item.team); setResults([]); }} className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-left hover:border-emerald-500">{item.team.logo && <img src={item.team.logo} alt="" className="h-9 w-9 object-contain" />}<span className="text-sm font-bold">{item.team.name}</span><span className="ml-auto text-xs text-emerald-400">Select →</span></button>)}</div>}
        </form>
      )}
    </section>
  );
}

const metrics: { key: keyof TeamSummary; label: string; higher: boolean | null }[] = [
  { key: "matchesPlayed", label: "Matches played", higher: true },
  { key: "wins", label: "Wins", higher: true },
  { key: "draws", label: "Draws", higher: null },
  { key: "losses", label: "Losses", higher: false },
  { key: "goalsFor", label: "Goals scored", higher: true },
  { key: "goalsAgainst", label: "Goals conceded", higher: false },
  { key: "goalDifference", label: "Goal difference", higher: true },
  { key: "cleanSheets", label: "Clean sheets", higher: true },
  { key: "averageGoalsFor", label: "Goals scored / match", higher: true },
  { key: "averageGoalsAgainst", label: "Goals conceded / match", higher: false },
];

function FormPills({ form }: { form: TeamSummary["form"] }) {
  if (!form.length) return <p className="text-xs text-slate-500">No recent completed matches available.</p>;
  return <div className="mt-3 flex flex-wrap gap-2">{form.map((match) => <span key={match.id} title={`${match.opponent}: ${match.goalsFor}-${match.goalsAgainst}`} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${match.result === "W" ? "bg-emerald-500/15 text-emerald-300" : match.result === "D" ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"}`}>{match.result}</span>)}</div>;
}

export default function TeamComparePage() {
  const [first, setFirst] = useState<Team["team"] | null>(null);
  const [second, setSecond] = useState<Team["team"] | null>(null);
  const [comparison, setComparison] = useState<{ home: TeamSummary; away: TeamSummary; headToHead: HeadToHeadMatch[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const headToHeadSummary = comparison && first && second
    ? comparison.headToHead.reduce(
        (summary, match) => {
          if (match.homeGoals === null || match.awayGoals === null) return summary;
          summary.firstGoals += match.homeId === first.id ? match.homeGoals : match.awayId === first.id ? match.awayGoals : 0;
          summary.secondGoals += match.homeId === second.id ? match.homeGoals : match.awayId === second.id ? match.awayGoals : 0;
          if (match.homeGoals === match.awayGoals) summary.draws += 1;
          else if (
            (match.homeGoals > match.awayGoals && match.homeId === first.id) ||
            (match.awayGoals > match.homeGoals && match.awayId === first.id)
          ) summary.firstWins += 1;
          else summary.secondWins += 1;
          return summary;
        },
        { firstWins: 0, draws: 0, secondWins: 0, firstGoals: 0, secondGoals: 0 }
      )
    : null;

  async function compare() {
    if (!first || !second) { setError("Select two teams first."); return; }
    if (first.id === second.id) { setError("Choose two different teams."); return; }
    setLoading(true); setError(""); setComparison(null);
    try {
      const response = await fetch(`/api/football/team-comparison?home=${first.id}&away=${second.id}`);
      const payload: ComparePayload = await response.json();
      if (!response.ok || !payload.success || !payload.home || !payload.away) throw new Error("Unable to compare these teams right now.");
      setComparison({
        home: { ...payload.home, team: { id: first.id, name: first.name, logo: first.logo } },
        away: { ...payload.away, team: { id: second.id, name: second.name, logo: second.logo } },
        headToHead: payload.headToHead ?? [],
      });
    } catch { setError("Unable to load team comparison right now. Please try again later."); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <Link href="/teams" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">← Back to teams</Link>
        <div className="mt-7 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Team comparison</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">Club versus club.</h1><p className="mt-4 text-sm leading-7 text-slate-400">Compare the last ten completed matches for two teams. Results, goals, clean sheets and form are calculated from actual fixtures returned by the football data provider.</p></div>
        <div className="mt-8 grid gap-5 md:grid-cols-2"><TeamPicker title="Team one" selected={first} onSelect={(team) => { setFirst(team); setComparison(null); }} /><TeamPicker title="Team two" selected={second} onSelect={(team) => { setSecond(team); setComparison(null); }} /></div>
        <button type="button" onClick={() => void compare()} disabled={loading || !first || !second} className="mt-5 w-full rounded-xl bg-emerald-500 px-6 py-4 font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">{loading ? "Comparing teams..." : "Compare teams"}</button>
        {error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</p>}
        {comparison ? (
          <section className="mt-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-slate-800 p-4 sm:p-6">
              <div className="text-center">{comparison.home.team.logo && <img src={comparison.home.team.logo} alt="" className="mx-auto mb-2 h-12 w-12 object-contain" />}<Link href={`/team/${comparison.home.team.id}`} aria-label={`View ${comparison.home.team.name} team profile`} className="text-sm font-black transition hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:text-lg">{comparison.home.team.name}</Link><FormPills form={comparison.home.form} /></div>
              <span className="rounded-full bg-slate-800 px-3 py-2 text-xs font-black text-emerald-400">VS</span>
              <div className="text-center">{comparison.away.team.logo && <img src={comparison.away.team.logo} alt="" className="mx-auto mb-2 h-12 w-12 object-contain" />}<Link href={`/team/${comparison.away.team.id}`} aria-label={`View ${comparison.away.team.name} team profile`} className="text-sm font-black transition hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:text-lg">{comparison.away.team.name}</Link><FormPills form={comparison.away.form} /></div>
            </div>
            <div className="divide-y divide-slate-800">{metrics.map((metric) => {
              const a = comparison.home[metric.key] as number, b = comparison.away[metric.key] as number;
              const aWins = metric.higher !== null && a !== b && (metric.higher ? a > b : a < b);
              const bWins = metric.higher !== null && a !== b && (metric.higher ? b > a : b < a);
              return <div key={metric.key} className="grid grid-cols-[1fr_minmax(120px,1.2fr)_1fr] items-center gap-2 px-3 py-4 sm:px-6"><p className={`text-center text-lg font-black ${aWins ? "text-emerald-400" : "text-white"}`}>{a}</p><p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">{metric.label}</p><p className={`text-center text-lg font-black ${bWins ? "text-emerald-400" : "text-white"}`}>{b}</p></div>;
            })}</div>
            <section className="border-t border-slate-800 p-5 sm:p-6">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Head-to-head</p>
                <h2 className="mt-1 text-xl font-black">Previous meetings</h2>
                <p className="mt-1 text-xs text-slate-500">The five most recent completed meetings between these teams.</p>
              </div>
              {headToHeadSummary && comparison.headToHead.length > 0 && (
                <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center sm:p-4">
                    <p className="text-2xl font-black text-emerald-300">{headToHeadSummary.firstWins}</p>
                    <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">{comparison.home.team.name} wins</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-center sm:p-4">
                    <p className="text-2xl font-black text-white">{headToHeadSummary.draws}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">Draws</p>
                  </div>
                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-center sm:p-4">
                    <p className="text-2xl font-black text-sky-300">{headToHeadSummary.secondWins}</p>
                    <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">{comparison.away.team.name} wins</p>
                  </div>
                  <div className="col-span-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Goals across these meetings</p>
                    <p className="mt-1 text-lg font-black tabular-nums">{headToHeadSummary.firstGoals} <span className="px-2 text-slate-600">—</span> {headToHeadSummary.secondGoals}</p>
                  </div>
                </div>
              )}
              {comparison.headToHead.length ? (
                <div className="space-y-3">
                  {comparison.headToHead.map((match) => {
                    const homeWon = match.homeGoals !== null && match.awayGoals !== null && match.homeGoals > match.awayGoals;
                    const awayWon = match.homeGoals !== null && match.awayGoals !== null && match.awayGoals > match.homeGoals;
                    return (
                      <div key={match.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 sm:p-4">
                        <div className="flex min-w-0 items-center gap-2">
                          {match.homeLogo && <img src={match.homeLogo} alt="" className="h-7 w-7 shrink-0 object-contain" />}
                          <Link href={`/team/${match.homeId}`} aria-label={`View ${match.home} team profile`} className={`truncate text-xs font-bold transition hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:text-sm ${homeWon ? "text-emerald-300" : "text-slate-200"}`}>{match.home}</Link>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black tabular-nums">{match.homeGoals ?? "–"} <span className="text-slate-500">:</span> {match.awayGoals ?? "–"}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        <div className="flex min-w-0 items-center justify-end gap-2">
                          <Link href={`/team/${match.awayId}`} aria-label={`View ${match.away} team profile`} className={`truncate text-right text-xs font-bold transition hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:text-sm ${awayWon ? "text-emerald-300" : "text-slate-200"}`}>{match.away}</Link>
                          {match.awayLogo && <img src={match.awayLogo} alt="" className="h-7 w-7 shrink-0 object-contain" />}
                        </div>
                        <p className="col-span-3 -mt-1 text-center text-[10px] text-slate-500">{match.competition}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-300">No previous meetings found</p>
                  <p className="mt-1 text-xs text-slate-500">There are no completed head-to-head fixtures available for these teams.</p>
                </div>
              )}
            </section>
            <p className="border-t border-slate-800 px-5 py-4 text-xs leading-5 text-slate-500">Form is ordered newest first by date. A dash is used only where data is unavailable. This comparison covers each team&apos;s latest ten completed fixtures, which may span different competitions and seasons.</p>
          </section>
        ) : !loading && <div className="mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center"><p className="text-lg font-bold">Choose two teams to get started</p><p className="mt-2 text-sm text-slate-400">Select clubs or national teams above, then compare their recent results.</p></div>}
      </div>
      <Footer />
    </main>
  );
}
