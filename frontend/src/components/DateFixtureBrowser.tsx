"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ApiFixture = {
  fixture: { id: number; date: string; status: { short: string; long: string; elapsed: number | null } };
  league: { id: number; name: string; logo?: string; country?: string };
  teams: { home: { id: number; name: string; logo?: string }; away: { id: number; name: string; logo?: string } };
  goals: { home: number | null; away: number | null };
};

function localDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

function dayLabel(value: string) {
  const date = new Date(`${value}T12:00:00+01:00`);
  return {
    weekday: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "Africa/Lagos" }).format(date),
    day: new Intl.DateTimeFormat("en", { day: "2-digit", timeZone: "Africa/Lagos" }).format(date),
    month: new Intl.DateTimeFormat("en", { month: "short", timeZone: "Africa/Lagos" }).format(date),
  };
}

function isFinished(status: string) {
  return ["FT", "AET", "PEN"].includes(status);
}
function isLive(status: string) {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(status);
}

function readableApiError(_error: unknown): string {
  return "Unable to load data right now. Please try again later.";
}

export default function DateFixtureBrowser() {
  const [dates, setDates] = useState<string[]>([]);
  const [today, setToday] = useState("");
  const [selected, setSelected] = useState("");
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (date: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/football/fixtures-by-date?date=${date}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(readableApiError(data.error));
      setFixtures(data.matches || []);
    } catch (err) {
      setFixtures([]);
      setError("Unable to load data right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentDay = localDate(new Date());
    setToday(currentDay);
    const base = new Date(`${currentDay}T12:00:00+01:00`);
    setDates(Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base);
      date.setDate(date.getDate() + index - 3);
      return localDate(date);
    }));
    setSelected(currentDay);
  }, []);

  useEffect(() => {
    if (selected) void load(selected);
  }, [load, selected]);

  const grouped = useMemo(() => {
    const map = new Map<string, ApiFixture[]>();
    for (const fixture of fixtures) {
      const name = fixture.league?.name || "Other competitions";
      map.set(name, [...(map.get(name) || []), fixture]);
    }
    return [...map.entries()];
  }, [fixtures]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141e29]">
      <div className="border-b border-white/[0.07] p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Match calendar</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-black sm:text-2xl">Scores & Fixtures</h2>
            <p className="mt-1 text-xs text-slate-400">Recent results, today&apos;s action and upcoming matches.</p>
          </div>
          <span className="text-xs text-slate-500">Nigeria time · GMT+1</span>
        </div>
        <div className="date-strip mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {dates.map((date) => {
            const label = dayLabel(date);
            const active = selected === date;
            const isToday = date === today;
            return (
              <button key={date} type="button" onClick={() => setSelected(date)}
                aria-pressed={active}
                className={`rounded-xl border px-1 py-3 text-center transition sm:py-3.5 ${active ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-white/[0.07] bg-[#0e1721] text-slate-300 hover:border-emerald-400/50"}`}>
                <span className="block text-[10px] font-bold uppercase">{isToday ? "Today" : label.weekday}</span>
                <span className="mt-1 block text-lg font-black">{label.day}</span>
                <span className="block text-[9px] uppercase opacity-70">{label.month}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {loading && <div className="p-10 text-center text-sm text-slate-400">Loading real fixtures and results...</div>}
        {!loading && error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">{error}</div>}
        {!loading && !error && fixtures.length === 0 && (
          <div className="rounded-xl bg-[#0e1721] p-9 text-center">
            <p className="text-2xl">⚽</p>
            <p className="mt-2 font-bold">No matches scheduled</p>
            <p className="mt-1 text-xs text-slate-500">No senior professional fixtures were returned for this date.</p>
          </div>
        )}
        {!loading && !error && grouped.map(([competition, games]) => (
          <section key={competition} className="mb-4 overflow-hidden rounded-xl border border-white/[0.06] last:mb-0">
            <h3 className="border-b border-white/[0.06] bg-[#101a26] px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-300">{competition}</h3>
            {games.map((game) => {
              const status = game.fixture.status.short;
              const finished = isFinished(status);
              const live = isLive(status);
              return (
                <article key={game.fixture.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-white/[0.05] px-3 py-3.5 last:border-0 hover:bg-white/[0.025] sm:px-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                      {game.teams.home.logo && <img src={game.teams.home.logo} alt="" className="h-5 w-5 object-contain" />}
                      <Link href={`/team/${game.teams.home.id}`} className="truncate transition-colors hover:text-emerald-400">
                        {game.teams.home.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                      {game.teams.away.logo && <img src={game.teams.away.logo} alt="" className="h-5 w-5 object-contain" />}
                      <Link href={`/team/${game.teams.away.id}`} className="truncate transition-colors hover:text-emerald-400">
                        {game.teams.away.name}
                      </Link>
                    </div>
                  </div>
                  <div className="min-w-[76px] text-right">
                    {finished || live ? (
                      <div className="text-sm font-black leading-6 text-white">
                        <div>{game.goals.home ?? "—"}</div><div>{game.goals.away ?? "—"}</div>
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-emerald-400">
                        {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }).format(new Date(game.fixture.date))}
                      </div>
                    )}
                    <span className={`mt-1 block text-[9px] font-black uppercase tracking-wider ${live ? "text-red-400" : finished ? "text-slate-500" : "text-emerald-400"}`}>
                      {live ? (game.fixture.status.elapsed ? `${game.fixture.status.elapsed}'` : "Live") : finished ? "Full time" : "Kick-off"}
                    </span>
                    <Link href={`/match/${game.fixture.id}`} className="mt-2 inline-block text-[9px] font-black uppercase tracking-wider text-slate-400 transition hover:text-emerald-400">
                      Match Centre →
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </section>
  );
}
