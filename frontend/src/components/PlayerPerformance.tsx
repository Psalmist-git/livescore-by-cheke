"use client";

import Link from "next/link";

interface PlayerStatistics {
  games?: {
    minutes?: number | null;
    number?: number | null;
    position?: string | null;
    rating?: string | number | null;
    captain?: boolean | null;
    substitute?: boolean | null;
  } | null;
  shots?: {
    total?: number | null;
    on?: number | null;
  } | null;
  goals?: {
    total?: number | null;
    assists?: number | null;
    conceded?: number | null;
    saves?: number | null;
  } | null;
  passes?: {
    total?: number | null;
    key?: number | null;
    accuracy?: string | number | null;
  } | null;
  tackles?: {
    total?: number | null;
    blocks?: number | null;
    interceptions?: number | null;
  } | null;
  duels?: {
    total?: number | null;
    won?: number | null;
  } | null;
  dribbles?: {
    attempts?: number | null;
    success?: number | null;
    past?: number | null;
  } | null;
  fouls?: {
    drawn?: number | null;
    committed?: number | null;
  } | null;
  penalty?: {
    scored?: number | null;
    missed?: number | null;
    saved?: number | null;
  } | null;
  cards?: {
    yellow?: number | null;
    red?: number | null;
  } | null;
}

interface MatchPlayer {
  player: {
    id: number;
    name: string;
    photo?: string | null;
  };
  statistics?: PlayerStatistics[] | null;
}

interface PlayerTeam {
  team: {
    id: number;
    name: string;
    logo?: string | null;
  };
  players: MatchPlayer[];
}

interface PlayerPerformanceProps {
  players?: PlayerTeam[] | null;
  homeTeam: string;
  awayTeam: string;
}

function displayValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

function getRating(rating: string | number | null | undefined) {
  if (rating === null || rating === undefined || rating === "") {
    return null;
  }

  const numericRating = Number(rating);

  return Number.isFinite(numericRating)
    ? numericRating.toFixed(1)
    : String(rating);
}

function getRatingStyle(rating: string | null) {
  if (rating === null) {
    return "border-white/10 bg-slate-800 text-slate-400";
  }

  const numericRating = Number(rating);

  if (!Number.isFinite(numericRating)) {
    return "border-white/10 bg-slate-800 text-white";
  }

  if (numericRating >= 8) {
    return "border-emerald-400/20 bg-emerald-400/15 text-emerald-300";
  }

  if (numericRating >= 7) {
    return "border-lime-400/20 bg-lime-400/10 text-lime-300";
  }

  if (numericRating >= 6) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-rose-400/20 bg-rose-400/10 text-rose-300";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PlayerCard({ player }: { player: MatchPlayer }) {
  const stats = player.statistics?.[0];
  const rating = getRating(stats?.games?.rating);

  const metrics = [
    {
      label: "Minutes played",
      value:
        stats?.games?.minutes !== null &&
        stats?.games?.minutes !== undefined
          ? `${stats.games.minutes}'`
          : null,
      highlight: false,
    },
    {
      label: "Goals",
      value: stats?.goals?.total,
      highlight: true,
    },
    {
      label: "Assists",
      value: stats?.goals?.assists,
      highlight: true,
    },
    {
      label: "Shots",
      value: stats?.shots?.total,
      highlight: false,
    },
    {
      label: "On target",
      value: stats?.shots?.on,
      highlight: false,
    },
    {
      label: "Passes",
      value: stats?.passes?.total,
      highlight: false,
    },
    {
      label: "Key passes",
      value: stats?.passes?.key,
      highlight: false,
    },
    {
      label: "Tackles",
      value: stats?.tackles?.total,
      highlight: false,
    },
    {
      label: "Interceptions",
      value: stats?.tackles?.interceptions,
      highlight: false,
    },
    {
      label: "Blocks",
      value: stats?.tackles?.blocks,
      highlight: false,
    },
    {
      label: "Duels won",
      value: stats?.duels?.won,
      highlight: false,
    },
    {
      label: "Duels contested",
      value: stats?.duels?.total,
      highlight: false,
    },
    {
      label: "Successful dribbles",
      value: stats?.dribbles?.success,
      highlight: false,
    },
    {
      label: "Dribbles attempted",
      value: stats?.dribbles?.attempts,
      highlight: false,
    },
    {
      label: "Opponents beaten",
      value: stats?.dribbles?.past,
      highlight: false,
    },
    {
      label: "Fouls drawn",
      value: stats?.fouls?.drawn,
      highlight: false,
    },
    {
      label: "Fouls committed",
      value: stats?.fouls?.committed,
      highlight: false,
    },
    {
      label: "Saves",
      value: stats?.goals?.saves,
      highlight: true,
    },
    {
      label: "Goals conceded",
      value: stats?.goals?.conceded,
      highlight: false,
    },
    {
      label: "Penalties scored",
      value: stats?.penalty?.scored,
      highlight: true,
    },
    {
      label: "Penalties missed",
      value: stats?.penalty?.missed,
      highlight: false,
    },
    {
      label: "Penalty saves",
      value: stats?.penalty?.saved,
      highlight: true,
    },
    {
      label: "Yellow cards",
      value: stats?.cards?.yellow,
      highlight: false,
    },
    {
      label: "Red cards",
      value: stats?.cards?.red,
      highlight: false,
    },
  ].filter(
    (metric) => metric.value !== null && metric.value !== undefined
  );

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/70 transition duration-200 hover:border-emerald-400/30 hover:bg-slate-900">
      <div className="flex items-center gap-3 p-4">
        {player.player.photo ? (
          <img
            src={player.player.photo}
            alt={player.player.name}
            className="h-14 w-14 shrink-0 rounded-full border border-white/10 bg-slate-800 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-sm font-bold text-emerald-300">
            {getInitials(player.player.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-white sm:text-base">
            <Link
              href={`/player/${player.player.id}`}
              title={`View ${player.player.name}'s player profile`}
              className="rounded-sm transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {player.player.name}
            </Link>
          </h4>

          <p className="mt-1 text-xs text-slate-400">
            {stats?.games?.position || "Position unavailable"}
            {stats?.games?.number != null
              ? ` · #${stats.games.number}`
              : ""}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {stats?.games?.captain && (
              <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                Captain
              </span>
            )}

            {stats?.games?.substitute && (
              <span className="rounded-md border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                Substitute
              </span>
            )}
          </div>
        </div>

        {rating !== null && (
          <div
            className={`shrink-0 rounded-xl border px-3 py-2 text-center ${getRatingStyle(rating)}`}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-75">
              Rating
            </p>
            <p className="mt-0.5 text-xl font-black">{rating}</p>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] px-4 py-3">
        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={`rounded-xl border px-3 py-2.5 ${
                  metric.highlight
                    ? "border-emerald-400/10 bg-emerald-400/[0.06]"
                    : "border-white/[0.04] bg-slate-800/60"
                }`}
              >
                <p className="text-[10px] font-medium text-slate-500">
                  {metric.label}
                </p>

                <p
                  className={`mt-1 text-lg font-bold ${
                    metric.highlight ? "text-emerald-300" : "text-white"
                  }`}
                >
                  {displayValue(metric.value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-white/[0.05] bg-slate-800/50 p-3 text-xs leading-5 text-slate-400">
            Individual statistics are not available for this player.
          </p>
        )}

        {stats?.passes?.accuracy !== null &&
          stats?.passes?.accuracy !== undefined && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-xs text-slate-400">
                Passing accuracy
              </span>
              <span className="text-sm font-bold text-emerald-300">
                {String(stats.passes.accuracy).includes("%")
                  ? stats.passes.accuracy
                  : `${stats.passes.accuracy}%`}
              </span>
            </div>
          )}
      </div>
    </article>
  );
}

function TeamPlayers({ team }: { team: PlayerTeam }) {
  const sortedPlayers = [...team.players].sort((first, second) => {
    const firstRawRating = first.statistics?.[0]?.games?.rating;
    const secondRawRating = second.statistics?.[0]?.games?.rating;
    const firstRating = firstRawRating == null || firstRawRating === "" ? Number.NaN : Number(firstRawRating);
    const secondRating = secondRawRating == null || secondRawRating === "" ? Number.NaN : Number(secondRawRating);
    const firstHasRating = Number.isFinite(firstRating);
    const secondHasRating = Number.isFinite(secondRating);

    if (firstHasRating && secondHasRating) return secondRating - firstRating;
    if (firstHasRating) return -1;
    if (secondHasRating) return 1;
    return first.player.name.localeCompare(second.player.name);
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-slate-900/60 p-4">
        {team.team.logo ? (
          <img
            src={team.team.logo}
            alt=""
            className="h-10 w-10 shrink-0 object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
            FC
          </div>
        )}

        <div className="min-w-0">
          <h3 className="truncate font-bold text-white">
            <Link
              href={`/team/${team.team.id}`}
              title={`View ${team.team.name} team profile`}
              className="rounded-sm transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {team.team.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Individual match performance
          </p>
        </div>

        <span className="ml-auto shrink-0 rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
          {team.players.length} players · highest ratings first
        </span>
      </div>

      {team.players.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {sortedPlayers.map((player) => (
            <PlayerCard key={player.player.id} player={player} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-slate-900/50 p-5 text-center text-sm text-slate-400">
          No player statistics are available for this team.
        </div>
      )}
    </section>
  );
}

export default function PlayerPerformance({
  players,
  homeTeam,
  awayTeam,
}: PlayerPerformanceProps) {
  if (!players || players.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.06] text-2xl">
          ⚽
        </div>

        <h3 className="mt-4 font-bold text-white">
          Player statistics unavailable
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
          API-Football has not provided individual player statistics for this
          match. These statistics may become available during or after the
          match.
        </p>
      </div>
    );
  }

  const homePlayers = players.filter(
    (team) => team.team.name.toLowerCase() === homeTeam.toLowerCase()
  );

  const awayPlayers = players.filter(
    (team) => team.team.name.toLowerCase() === awayTeam.toLowerCase()
  );

  const displayedTeams = [...homePlayers, ...awayPlayers];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
              Match analysis
            </span>
          </div>

          <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
            Player Performance
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Individual match statistics supplied by API-Football.
          </p>
        </div>

        <span className="w-fit rounded-full border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
          {displayedTeams.reduce(
            (total, team) => total + team.players.length,
            0
          )}{" "}
          players tracked
        </span>
      </div>

      {displayedTeams.length > 0 ? (
        <div className="space-y-8">
          {displayedTeams.map((team) => (
            <TeamPlayers key={team.team.id} team={team} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 text-center">
          <h3 className="font-semibold text-white">
            Player data could not be matched
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Player data was returned, but the teams could not be matched to
            this fixture.
          </p>
        </div>
      )}
    </div>
  );
}