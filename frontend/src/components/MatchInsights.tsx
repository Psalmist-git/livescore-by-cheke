import Link from "next/link";

interface MatchInsightEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    name: string;
  };
  type: string;
  detail: string;
}

interface MatchInsightsProps {
  events: MatchInsightEvent[];
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: number;
  awayTeamId?: number;
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
  elapsed: number | null;
}

export default function MatchInsights({
  events,
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
  homeGoals,
  awayGoals,
  status,
  elapsed,
}: MatchInsightsProps) {
  const getTeamEvents = (teamName: string) =>
    events.filter(
      (event) =>
        event.team.name.toLowerCase() === teamName.toLowerCase()
    );

  const getCardCounts = (teamName: string) => {
    const cards = getTeamEvents(teamName).filter(
      (event) => event.type.toLowerCase() === "card"
    );

    return {
      yellow: cards.filter((event) =>
        event.detail.toLowerCase().includes("yellow")
      ).length,

      red: cards.filter((event) => {
        const detail = event.detail.toLowerCase();

        return (
          detail.includes("red") ||
          detail.includes("second yellow")
        );
      }).length,
    };
  };

  const getSubstitutionCount = (teamName: string) =>
    getTeamEvents(teamName).filter((event) => {
      const type = event.type.toLowerCase();

      return type === "subst" || type === "substitution";
    }).length;

  const homeCards = getCardCounts(homeTeam);
  const awayCards = getCardCounts(awayTeam);

  const homeSubstitutions = getSubstitutionCount(homeTeam);
  const awaySubstitutions = getSubstitutionCount(awayTeam);

  const totalGoals =
    homeGoals !== null && awayGoals !== null
      ? homeGoals + awayGoals
      : null;

  const normalizedStatus = status.toLowerCase();

  const activeStatuses = [
    "1h",
    "2h",
    "et",
    "bt",
    "p",
    "live",
    "first half",
    "second half",
    "extra time",
    "in play",
    "penalty in progress",
  ];

  const isMatchInProgress = activeStatuses.some((activeStatus) =>
    normalizedStatus.includes(activeStatus)
  );

  const statusLabel =
    isMatchInProgress && elapsed !== null && elapsed > 0
      ? `${elapsed}' played`
      : status || "Status unavailable";

  const insights = [
    {
      label: "Total Goals",
      value: totalGoals !== null ? totalGoals : "—",
      description: "Official match score",
      icon: "⚽",
      accent: "text-emerald-300",
      border: "border-emerald-400/15",
    },
    {
      label: "Yellow Cards",
      value: homeCards.yellow + awayCards.yellow,
      description: `${homeCards.yellow} home · ${awayCards.yellow} away`,
      icon: "🟨",
      accent: "text-amber-300",
      border: "border-amber-400/15",
    },
    {
      label: "Red Cards",
      value: homeCards.red + awayCards.red,
      description: `${homeCards.red} home · ${awayCards.red} away`,
      icon: "🟥",
      accent: "text-rose-300",
      border: "border-rose-400/15",
    },
    {
      label: "Substitutions",
      value: homeSubstitutions + awaySubstitutions,
      description: `${homeSubstitutions} home · ${awaySubstitutions} away`,
      icon: "🔄",
      accent: "text-sky-300",
      border: "border-sky-400/15",
    },
    {
      label: "Recorded Events",
      value: events.length,
      description: "Events returned by the API",
      icon: "📋",
      accent: "text-violet-300",
      border: "border-violet-400/15",
    },
  ];

  const teams = [
    {
      name: homeTeam,
      id: homeTeamId,
      cards: homeCards,
      substitutions: homeSubstitutions,
      color: "text-emerald-300",
      badge: "bg-emerald-400/10",
      dot: "bg-emerald-400",
    },
    {
      name: awayTeam,
      id: awayTeamId,
      cards: awayCards,
      substitutions: awaySubstitutions,
      color: "text-sky-300",
      badge: "bg-sky-400/10",
      dot: "bg-sky-400",
    },
  ];

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/70">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              Match analysis
            </span>
          </div>

          <h2 className="mt-2 text-xl font-black tracking-tight text-white">
            Match Insights
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            A statistical overview of the events recorded in this match.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800 px-3 py-2">
          {isMatchInProgress && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
          )}

          <span className="text-xs font-semibold text-emerald-300">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-6">
        {/* INSIGHT CARDS */}

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">
              Match Statistics
            </h3>

            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              Match totals
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {insights.map((insight) => (
              <div
                key={insight.label}
                className={`rounded-2xl border bg-slate-800/60 p-4 transition duration-200 hover:bg-slate-800 ${insight.border}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl">{insight.icon}</span>

                  <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                </div>

                <p className={`mt-4 text-3xl font-black ${insight.accent}`}>
                  {insight.value}
                </p>

                <p className="mt-1 text-xs font-bold text-white">
                  {insight.label}
                </p>

                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM BREAKDOWN */}

        <div className="border-t border-white/[0.06] pt-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">
              Team Breakdown
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Compare disciplinary records and substitutions.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {teams.map((team) => (
              <div
                key={team.name}
                className="rounded-2xl border border-white/[0.06] bg-slate-800/50 p-4"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${team.dot}`} />

                  {team.id !== undefined ? (
                    <Link
                      href={`/team/${team.id}`}
                      className={`min-w-0 truncate text-sm font-bold transition hover:underline ${team.color}`}
                      title={`View ${team.name}'s team profile`}
                    >
                      {team.name}
                    </Link>
                  ) : (
                    <h4 className={`min-w-0 truncate text-sm font-bold ${team.color}`}>
                      {team.name}
                    </h4>
                  )}

                  <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${team.badge} ${team.color}`}>
                    {team.substitutions} subs
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[0.04] bg-slate-900/70 p-3">
                    <span className="text-sm">🟨</span>
                    <p className="mt-2 text-xl font-black text-white">
                      {team.cards.yellow}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Yellow
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.04] bg-slate-900/70 p-3">
                    <span className="text-sm">🟥</span>
                    <p className="mt-2 text-xl font-black text-white">
                      {team.cards.red}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Red
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.04] bg-slate-900/70 p-3">
                    <span className="text-sm">🔄</span>
                    <p className="mt-2 text-xl font-black text-white">
                      {team.substitutions}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Subs
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DATA NOTICE */}

        {events.length === 0 && (
          <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-4">
            <p className="text-xs leading-5 text-amber-200/80">
              No match events were returned. Card and substitution counts
              may therefore be incomplete.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}