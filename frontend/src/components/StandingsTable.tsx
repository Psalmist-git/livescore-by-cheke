import Link from "next/link";

interface StandingTeam {
  id: number;
  name: string;
  logo: string;
}

interface TeamStatistics {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: {
    for: number;
    against: number;
  };
}

interface Standing {
  rank: number;
  team: StandingTeam;
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  description: string | null;
  all: TeamStatistics;
}

interface StandingsTableProps {
  groups: Standing[][];
}

export default function StandingsTable({
  groups,
}: StandingsTableProps) {
  if (!groups || groups.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 p-8 text-center">
        <p className="text-slate-400">
          Standings are not currently available for this competition.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group, groupIndex) => (
        <div
          key={`${group[0]?.group || "group"}-${groupIndex}`}
          className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
        >
          <div className="border-b border-slate-800 px-5 py-4">
            <h3 className="text-lg font-bold">
              {group[0]?.group || `League Table ${groupIndex + 1}`}
            </h3>
          </div>

          <p className="px-5 py-2 text-[10px] text-slate-500 sm:hidden">Swipe horizontally to view all table columns →</p>
          <div className="overflow-x-auto overscroll-x-contain touch-pan-x">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-800/70 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-4">Pos</th>
                  <th className="px-4 py-4">Club</th>
                  <th className="px-3 py-4 text-center">MP</th>
                  <th className="px-3 py-4 text-center">W</th>
                  <th className="px-3 py-4 text-center">D</th>
                  <th className="px-3 py-4 text-center">L</th>
                  <th className="px-3 py-4 text-center">GF</th>
                  <th className="px-3 py-4 text-center">GA</th>
                  <th className="px-3 py-4 text-center">GD</th>
                  <th className="px-4 py-4 text-center">Pts</th>
                </tr>
              </thead>

              <tbody>
                {group.map((team) => (
                  <tr
                    key={team.team.id}
                    className="border-t border-slate-800 transition hover:bg-slate-800/60"
                  >
                    <td className="px-4 py-4 font-bold text-slate-300">
                      {team.rank}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={team.team.logo}
                          alt={`${team.team.name} logo`}
                          className="h-7 w-7 object-contain"
                        />

                        <Link
                          href={`/team/${team.team.id}`}
                          aria-label={`View ${team.team.name} team profile`}
                          className="whitespace-nowrap font-semibold transition hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm"
                        >
                          {team.team.name}
                        </Link>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-center">
                      {team.all.played}
                    </td>

                    <td className="px-3 py-4 text-center text-green-400">
                      {team.all.win}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {team.all.draw}
                    </td>

                    <td className="px-3 py-4 text-center text-red-400">
                      {team.all.lose}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {team.all.goals.for}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {team.all.goals.against}
                    </td>

                    <td className="px-3 py-4 text-center">
                      {team.goalsDiff > 0 ? "+" : ""}
                      {team.goalsDiff}
                    </td>

                    <td className="px-4 py-4 text-center font-bold text-green-400">
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
            MP: Matches Played · W: Wins · D: Draws · L: Losses ·
            GF: Goals For · GA: Goals Against · GD: Goal Difference ·
            Pts: Points
          </div>
        </div>
      ))}
    </div>
  );
}