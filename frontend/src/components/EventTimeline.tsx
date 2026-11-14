"use client";

import Link from "next/link";
import { useState } from "react";

interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    name: string;
  };
  player: {
    id?: number | null;
    name: string | null;
  };
  assist: {
    id?: number | null;
    name: string | null;
  } | null;
  type: string;
  detail: string;
  comments: string | null;
}

interface EventTimelineProps {
  events: MatchEvent[];
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  awayTeamId?: number;
}

type EventFilter = "all" | "goals" | "cards" | "substitutions" | "var";

function getMinuteLabel(event: MatchEvent): string {
  return `${event.time.elapsed}'${
    event.time.extra ? `+${event.time.extra}` : ""
  }`;
}

function getEventIcon(event: MatchEvent): string {
  const type = event.type.toLowerCase();
  const detail = event.detail.toLowerCase();

  if (type === "goal") {
    return detail.includes("own goal") ? "🥅" : "⚽";
  }

  if (type === "card") {
    if (detail.includes("red")) return "🟥";
    if (detail.includes("yellow")) return "🟨";
    return "🃏";
  }

  if (type === "subst" || type === "substitution") return "🔄";
  if (type === "var") return "📺";

  return "📌";
}

function getEventStyle(event: MatchEvent): string {
  const type = event.type.toLowerCase();
  const detail = event.detail.toLowerCase();

  if (type === "goal") {
    return "border-emerald-400/20 bg-emerald-400/[0.07]";
  }

  if (type === "card" && detail.includes("red")) {
    return "border-rose-400/20 bg-rose-400/[0.07]";
  }

  if (type === "card") {
    return "border-amber-400/20 bg-amber-400/[0.07]";
  }

  if (type === "subst" || type === "substitution") {
    return "border-sky-400/20 bg-sky-400/[0.07]";
  }

  if (type === "var") {
    return "border-violet-400/20 bg-violet-400/[0.07]";
  }

  return "border-white/[0.08] bg-slate-800/70";
}

function getEventTitle(event: MatchEvent): string {
  const type = event.type.toLowerCase();

  if (type === "goal") return "GOAL";
  if (type === "card") return event.detail.toUpperCase();
  if (type === "subst" || type === "substitution") return "SUBSTITUTION";
  if (type === "var") return "VAR";

  return event.type.toUpperCase();
}

function getGoalDescription(event: MatchEvent): string {
  const detail = event.detail.toLowerCase();

  if (detail.includes("own goal")) return "Own Goal";
  if (detail.includes("penalty")) return "Penalty";

  return "Goal";
}

function GoalScorer({ event }: { event: MatchEvent }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-3 last:border-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 text-base">⚽</span>

        <div className="min-w-0">
          {event.player?.id ? (
            <Link href={`/player/${event.player.id}`} className="break-words text-sm font-bold text-white transition hover:text-emerald-300">
              {event.player.name || "Unknown scorer"}
            </Link>
          ) : (
            <p className="break-words text-sm font-bold text-white">
              {event.player?.name || "Unknown scorer"}
            </p>
          )}

          <p className="mt-1 text-xs text-slate-400">
            {getGoalDescription(event)}
            {event.assist?.name ? " · Assist: " : ""}
            {event.assist?.name && event.assist.id ? (
              <Link href={`/player/${event.assist.id}`} className="transition hover:text-emerald-300">
                {event.assist.name}
              </Link>
            ) : event.assist?.name || ""}
          </p>
        </div>
      </div>

      <span className="shrink-0 rounded-lg border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-black text-emerald-300">
        {getMinuteLabel(event)}
      </span>
    </div>
  );
}

function EventCard({ event }: { event: MatchEvent }) {
  const type = event.type.toLowerCase();

  return (
    <div
      className={`w-full rounded-xl border p-3 transition-colors ${getEventStyle(event)}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base">{getEventIcon(event)}</span>

        <span className="text-[10px] font-black tracking-wider text-slate-300">
          {getEventTitle(event)}
        </span>
      </div>

      {event.player?.id ? (
        <Link href={`/player/${event.player.id}`} className="break-words text-sm font-bold text-white transition hover:text-emerald-300">
          {event.player.name || event.detail || "Match event"}
        </Link>
      ) : (
        <p className="break-words text-sm font-bold text-white">
          {event.player?.name || event.detail || "Match event"}
        </p>
      )}

      {(type === "subst" || type === "substitution") &&
        event.assist?.name && (
          <p className="mt-1 text-xs text-slate-400">
            Replaced: {event.assist.id ? (
              <Link href={`/player/${event.assist.id}`} className="transition hover:text-emerald-300">{event.assist.name}</Link>
            ) : event.assist.name}
          </p>
        )}

      {type === "goal" && event.assist?.name && (
        <p className="mt-1 text-xs text-slate-400">
          Assist: {event.assist.id ? (
            <Link href={`/player/${event.assist.id}`} className="transition hover:text-emerald-300">{event.assist.name}</Link>
          ) : event.assist.name}
        </p>
      )}

      {event.comments && (
        <p className="mt-2 break-words text-xs leading-5 text-slate-400">
          {event.comments}
        </p>
      )}

      {event.detail &&
        type !== "card" &&
        type !== "goal" &&
        type !== "subst" &&
        type !== "substitution" && (
          <p className="mt-1 text-[10px] text-slate-500">
            {event.detail}
          </p>
        )}
    </div>
  );
}

export default function EventTimeline({
  events,
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
}: EventTimelineProps) {
  const [activeFilter, setActiveFilter] =
    useState<EventFilter>("all");

  const sortedEvents = [...events].sort((a, b) => {
    const firstMinute =
      a.time.elapsed * 100 + (a.time.extra ?? 0);

    const secondMinute =
      b.time.elapsed * 100 + (b.time.extra ?? 0);

    return firstMinute - secondMinute;
  });

  const goalEvents = sortedEvents.filter(
    (event) => event.type.toLowerCase() === "goal"
  );

  const homeGoals = goalEvents.filter(
    (event) =>
      event.team.name.toLowerCase() === homeTeam.toLowerCase()
  );

  const awayGoals = goalEvents.filter(
    (event) =>
      event.team.name.toLowerCase() === awayTeam.toLowerCase()
  );

  const filteredEvents = sortedEvents.filter((event) => {
    const type = event.type.toLowerCase();

    switch (activeFilter) {
      case "goals":
        return type === "goal";

      case "cards":
        return type === "card";

      case "substitutions":
        return type === "subst" || type === "substitution";

      case "var":
        return type === "var";

      case "all":
      default:
        return true;
    }
  });

  const filters: {
    label: string;
    value: EventFilter;
    icon: string;
  }[] = [
    { label: "All Events", value: "all", icon: "📋" },
    { label: "Goals", value: "goals", icon: "⚽" },
    { label: "Cards", value: "cards", icon: "🟨" },
    {
      label: "Substitutions",
      value: "substitutions",
      icon: "🔄",
    },
    { label: "VAR", value: "var", icon: "📺" },
  ];

  return (
    <section className="space-y-6">
      {/* GOAL SCORERS */}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/70">
        <div className="border-b border-white/[0.06] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              Match summary
            </span>
          </div>

          <h3 className="mt-2 text-lg font-black text-white">
            Goal Scorers
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Scoring information recorded by the match data provider.
          </p>
        </div>

        {goalEvents.length === 0 ? (
          <div className="p-7 text-center">
            <span className="text-2xl">⚽</span>
            <p className="mt-3 text-sm text-slate-400">
              No goal events have been returned for this match.
            </p>
          </div>
        ) : (
          <div className="grid divide-y divide-white/[0.06] md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="truncate text-sm font-bold text-emerald-300">
                  {homeTeamId ? (
                    <Link href={`/team/${homeTeamId}`} className="transition hover:text-emerald-200 hover:underline">{homeTeam}</Link>
                  ) : homeTeam}
                </h4>

                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                  {homeGoals.length} goals
                </span>
              </div>

              {homeGoals.length === 0 ? (
                <p className="py-4 text-xs text-slate-500">
                  No goal events recorded.
                </p>
              ) : (
                homeGoals.map((event, index) => (
                  <GoalScorer
                    key={`home-goal-${event.time.elapsed}-${index}`}
                    event={event}
                  />
                ))
              )}
            </div>

            <div className="p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="truncate text-sm font-bold text-sky-300">
                  {awayTeamId ? (
                    <Link href={`/team/${awayTeamId}`} className="transition hover:text-sky-200 hover:underline">{awayTeam}</Link>
                  ) : awayTeam}
                </h4>

                <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-xs font-bold text-sky-300">
                  {awayGoals.length} goals
                </span>
              </div>

              {awayGoals.length === 0 ? (
                <p className="py-4 text-xs text-slate-500">
                  No goal events recorded.
                </p>
              ) : (
                awayGoals.map((event, index) => (
                  <GoalScorer
                    key={`away-goal-${event.time.elapsed}-${index}`}
                    event={event}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MATCH TIMELINE */}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/70">
        <div className="border-b border-white/[0.06] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Live match data
                </span>
              </div>

              <h3 className="mt-2 text-lg font-black text-white">
                Match Timeline
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Events recorded throughout the match.
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400">
              {sortedEvents.length} events
            </span>
          </div>
        </div>

        {/* EVENT FILTERS */}

        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Filter match events
          </p>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  aria-pressed={isActive}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-white/[0.08] bg-slate-800/70 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{filter.icon}</span>
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {sortedEvents.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-slate-800 text-2xl">
                ⚽
              </div>

              <h4 className="mt-4 font-bold text-white">
                No Match Events Yet
              </h4>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Official match events are not currently available.
                Check again as the match progresses.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-slate-800/50 px-4 py-10 text-center">
              <div className="text-2xl">🔎</div>

              <h4 className="mt-3 font-bold text-white">
                No{" "}
                {filters.find(
                  (filter) => filter.value === activeFilter
                )?.label}{" "}
                Found
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                There are no recorded events in this category.
              </p>

              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Show All Events
              </button>
            </div>
          ) : (
            <>
              {/* TEAM HEADERS */}

              <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span className="truncate text-left text-xs font-bold text-emerald-300">
                  {homeTeamId ? (
                    <Link href={`/team/${homeTeamId}`} className="transition hover:text-emerald-200 hover:underline">{homeTeam}</Link>
                  ) : homeTeam}
                </span>

                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Minute
                </span>

                <span className="truncate text-right text-xs font-bold text-sky-300">
                  {awayTeamId ? (
                    <Link href={`/team/${awayTeamId}`} className="transition hover:text-sky-200 hover:underline">{awayTeam}</Link>
                  ) : awayTeam}
                </span>
              </div>

              {/* TIMELINE EVENTS */}

              <div className="relative space-y-5">
                <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-emerald-400/30 via-white/10 to-sky-400/30" />

                {filteredEvents.map((event, index) => {
                  const isHome =
                    event.team.name.toLowerCase() ===
                    homeTeam.toLowerCase();

                  const isAway =
                    event.team.name.toLowerCase() ===
                    awayTeam.toLowerCase();

                  return (
                    <div
                      key={`${event.time.elapsed}-${event.type}-${index}`}
                      className="relative grid grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_58px_minmax(0,1fr)] sm:gap-3"
                    >
                      {/* HOME TEAM EVENT */}

                      <div className="flex justify-end">
                        {isHome && (
                          <div className="w-full max-w-[280px]">
                            <EventCard event={event} />
                          </div>
                        )}
                      </div>

                      {/* MATCH MINUTE */}

                      <div className="relative z-10 flex justify-center">
                        <span className="flex min-h-9 min-w-10 items-center justify-center rounded-full border border-white/10 bg-slate-800 px-1.5 text-[10px] font-black text-emerald-300 shadow-lg sm:min-w-12 sm:text-xs">
                          {getMinuteLabel(event)}
                        </span>
                      </div>

                      {/* AWAY TEAM EVENT */}

                      <div className="flex justify-start">
                        {isAway && (
                          <div className="w-full max-w-[280px]">
                            <EventCard event={event} />
                          </div>
                        )}

                        {!isHome && !isAway && (
                          <div className="w-full max-w-[280px] rounded-xl border border-white/[0.08] bg-slate-800/70 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {event.team.name}
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold text-white">
                              {event.detail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* TIMELINE FOOTER */}

        <div className="border-t border-white/[0.06] bg-slate-950/30 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-[11px] text-slate-400">
            <span>⚽ Goals</span>
            <span>🟨 Yellow cards</span>
            <span>🟥 Red cards</span>
            <span>🔄 Substitutions</span>
            <span>📺 VAR</span>
          </div>

          <p className="mt-4 text-center text-[10px] text-slate-500">
            Showing {filteredEvents.length} of {sortedEvents.length} recorded events
          </p>
        </div>
      </div>
    </section>
  );
}