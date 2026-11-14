"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LineupPitch from "@/components/LineupPitch";
import EventTimeline from "@/components/EventTimeline";
import MatchInsights from "@/components/MatchInsights";
import PlayerPerformance from "@/components/PlayerPerformance";
import MatchNotifications from "@/components/MatchNotifications";
import YouTubeHighlights from "@/components/YouTubeHighlights";
import MatchOdds from "@/components/MatchOdds";

interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: { name: string };
  player: { id?: number | null; name: string | null };
  assist: { id?: number | null; name: string | null } | null;
  type: string;
  detail: string;
  comments: string | null;
}

interface MatchStatistic {
  type: string;
  value: string | number | null;
}

interface LineupPlayer {
  player: {
    id: number;
    name: string;
    number: number;
    pos: string;
  };
}

interface MatchLineup {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  coach?: {
    id: number | null;
    name: string;
    photo?: string | null;
  } | null;
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

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
  cards?: {
    yellow?: number | null;
    red?: number | null;
  } | null;
  penalty?: {
    won?: number | null;
    commited?: number | null;
    scored?: number | null;
    missed?: number | null;
    saved?: number | null;
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

interface MatchInjury {
  team: { id: number; name: string; logo?: string | null };
  player: {
    id: number;
    name: string;
    type?: string | null;
    reason?: string | null;
  };
}

interface MatchDetails {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
      extra: number | null;
    };
    venue: {
      name: string | null;
      city: string | null;
    };
    referee?: string | null;
  };
  league: {
    id: number;
    season: number;
    name: string;
    country: string;
    logo: string;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
  events: MatchEvent[];
  lineups: MatchLineup[];
  statistics: Array<{
    team: { name: string };
    statistics: MatchStatistic[];
  }>;
  players?: PlayerTeam[];
  injuries?: MatchInjury[];
}

interface EndpointDiagnostic {
  endpoint: string;
  success: boolean;
  results: number;
  message: string;
}

interface MatchResponse {
  success?: boolean;
  match?: MatchDetails;
  error?: unknown;
  diagnostics?: {
    events?: EndpointDiagnostic;
    lineups?: EndpointDiagnostic;
    statistics?: EndpointDiagnostic;
    players?: EndpointDiagnostic;
    injuries?: EndpointDiagnostic;
  };
}

interface MatchStatusResponse {
  success?: boolean;
  status?: MatchDetails["fixture"]["status"];
  goals?: MatchDetails["goals"];
  error?: unknown;
}

interface MatchCentreClientProps {
  id: string;
}

interface StatisticRow {
  type: string;
  home: string | number | null;
  away: string | number | null;
}

const LIVE_STATUSES = [
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "LIVE",
  "INT",
  "SUSP",
  "INTERRUPTED",
];

const EVENT_ELIGIBLE_STATUSES = [
  ...LIVE_STATUSES,
  "FT",
  "AET",
  "PEN",
];

const TABS = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "lineups", label: "Lineups", icon: "⚽" },
  { id: "table", label: "Table", icon: "🏆" },
  { id: "statistics", label: "Stats", icon: "📊" },
  { id: "news", label: "News", icon: "📰" },
  { id: "betting", label: "Betting", icon: "📈" },
  { id: "players", label: "Players", icon: "👤" },
  { id: "highlights", label: "Highlights", icon: "▶" },
];

function getErrorMessage(_error: unknown): string {
  return "Unable to load data right now. Please try again later.";
}

function getNumericValue(
  value: string | number | null
): number | null {
  if (value === null) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleanedValue = value
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  if (!cleanedValue || cleanedValue.includes("/")) return null;

  const parsed = Number(cleanedValue);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatStatistic(
  value: string | number | null
): string {
  return value === null ? "—" : String(value);
}

function isPercentageStatistic(
  type: string,
  homeValue: string | number | null,
  awayValue: string | number | null
): boolean {
  const normalizedType = type.toLowerCase();

  const percentageTypes = [
    "possession",
    "percentage",
    "accuracy",
    "success rate",
    "pass %",
    "passes %",
  ];

  return (
    percentageTypes.some((item) => normalizedType.includes(item)) ||
    (typeof homeValue === "string" && homeValue.includes("%")) ||
    (typeof awayValue === "string" && awayValue.includes("%"))
  );
}

function getStatisticRows(
  statistics: MatchDetails["statistics"],
  homeTeam: string,
  awayTeam: string
): StatisticRow[] {
  const homeStatistics = statistics.find(
    (item) =>
      item.team.name.toLowerCase() === homeTeam.toLowerCase()
  );

  const awayStatistics = statistics.find(
    (item) =>
      item.team.name.toLowerCase() === awayTeam.toLowerCase()
  );

  const rows = new Map<string, StatisticRow>();

  homeStatistics?.statistics.forEach((stat) => {
    rows.set(stat.type, {
      type: stat.type,
      home: stat.value,
      away: null,
    });
  });

  awayStatistics?.statistics.forEach((stat) => {
    const existing = rows.get(stat.type);

    if (existing) {
      existing.away = stat.value;
    } else {
      rows.set(stat.type, {
        type: stat.type,
        home: null,
        away: stat.value,
      });
    }
  });

  return Array.from(rows.values());
}

function StatisticComparison({ stat }: { stat: StatisticRow }) {
  const homeValue = getNumericValue(stat.home);
  const awayValue = getNumericValue(stat.away);

  const canCompare =
    homeValue !== null && awayValue !== null;

  const isPercentage = isPercentageStatistic(
    stat.type,
    stat.home,
    stat.away
  );

  const total =
    canCompare ? homeValue + awayValue : 0;

  const homeWidth =
    canCompare && total > 0
      ? (homeValue / total) * 100
      : 0;

  const awayWidth =
    canCompare && total > 0
      ? (awayValue / total) * 100
      : 0;

  const homePercentageWidth =
    homeValue !== null
      ? Math.min(Math.max(homeValue, 0), 100)
      : 0;

  const awayPercentageWidth =
    awayValue !== null
      ? Math.min(Math.max(awayValue, 0), 100)
      : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c1725] p-4 transition hover:border-white/10">
      <div className="mb-3 grid grid-cols-3 items-center gap-2">
        <span className="break-words text-sm font-bold text-emerald-400">
          {formatStatistic(stat.home)}
        </span>

        <span className="text-center text-xs font-medium text-slate-400">
          {stat.type}
        </span>

        <span className="break-words text-right text-sm font-bold text-blue-400">
          {formatStatistic(stat.away)}
        </span>
      </div>

      {isPercentage ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${homePercentageWidth}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">Home</p>
          </div>

          <div>
            <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${awayPercentageWidth}%` }}
              />
            </div>
            <p className="text-right text-[10px] text-slate-500">
              Away
            </p>
          </div>
        </div>
      ) : canCompare && total > 0 ? (
        <div className="flex h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${homeWidth}%` }}
          />
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${awayWidth}%` }}
          />
        </div>
      ) : (
        <p className="text-center text-[10px] text-slate-500">
          Comparison unavailable
        </p>
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
        {eyebrow}
      </p>
      <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

export default function MatchCentreClient({
  id,
}: MatchCentreClientProps) {
  const [match, setMatch] = useState<MatchDetails | null>(null);

  const [diagnostics, setDiagnostics] =
    useState<MatchResponse["diagnostics"]>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusRefreshError, setStatusRefreshError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [standings, setStandings] = useState<Array<{
    rank: number;
    team: { id: number; name: string; logo: string };
    points: number;
    goalsDiff: number;
    form?: string | null;
    description?: string | null;
    group?: string | null;
    all: { played: number; win: number; draw: number; lose: number; goals?: { for: number; against: number } };
  }>>([]);
  const [tableError, setTableError] = useState("");
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [matchNews, setMatchNews] = useState<Array<{id:string;title:string;link:string;source:string;publishedAt:string;summary?:string}>>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState("");

  const [teamForm, setTeamForm] = useState<{ home: Array<{id:number;date:string;opponent:string;goalsFor:number|null;goalsAgainst:number|null;result:"W"|"D"|"L"}>; away: Array<{id:number;date:string;opponent:string;goalsFor:number|null;goalsAgainst:number|null;result:"W"|"D"|"L"}> } | null>(null);
  const [teamFormLoading, setTeamFormLoading] = useState(false);
  const [teamFormError, setTeamFormError] = useState("");
  const [headToHead, setHeadToHead] = useState<Array<{id:number;date:string;home:string;away:string;homeId:number;awayId:number;homeLogo?:string;awayLogo?:string;homeGoals:number|null;awayGoals:number|null;competition:string}>>([]);
  const [headToHeadLoading, setHeadToHeadLoading] = useState(false);
  const [headToHeadError, setHeadToHeadError] = useState("");
  const [now, setNow] = useState(0);
  const [shareFeedback, setShareFeedback] = useState("");

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const statusRefreshInFlight = useRef(false);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const handleShareMatch = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${match?.teams.home.name ?? "Home"} vs ${match?.teams.away.name ?? "Away"}`;
    const shareText = `Follow the match on LiveScore by Cheke: ${shareTitle}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareFeedback("Match shared");
        window.setTimeout(() => setShareFeedback(""), 2500);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("Match link copied");
      window.setTimeout(() => setShareFeedback(""), 2500);
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback("Match link copied");
      } catch {
        setShareFeedback("Unable to share this match");
      }

      window.setTimeout(() => setShareFeedback(""), 3000);
    }
  }, [match]);

  const loadedMatchData = useRef(new Set<string>());
  const matchRequestController = useRef<AbortController | null>(null);

  const loadMatch = useCallback(
    async (isRefresh = false) => {
      matchRequestController.current?.abort();
      const controller = new AbortController();
      matchRequestController.current = controller;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `/api/football/match?id=${encodeURIComponent(id)}`,
          { cache: "no-store", signal: controller.signal }
        );

        const data: MatchResponse = await response.json();

        if (!response.ok || !data.success || !data.match) {
          throw new Error(getErrorMessage(data.error));
        }

        if (controller.signal.aborted) return;
        setMatch(data.match);
        setDiagnostics(data.diagnostics);
        setStatusRefreshError("");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading this match."
        );
      } finally {
        if (matchRequestController.current === controller) {
          matchRequestController.current = null;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    loadedMatchData.current.clear();
    setMatch(null);
    setDiagnostics(undefined);
    setStandings([]);
    setTableError("");
    setStandingsLoading(false);
    setMatchNews([]);
    setNewsLoading(false);
    setNewsError("");
    setTeamForm(null);
    setTeamFormLoading(false);
    setTeamFormError("");
    setHeadToHead([]);
    setHeadToHeadLoading(false);
    setHeadToHeadError("");
    setStatusRefreshError("");
    void loadMatch();

    return () => {
      matchRequestController.current?.abort();
    };
  }, [loadMatch]);

  // Refresh the score and event timeline together, with a conservative
  // polling interval to avoid unnecessary provider requests.
  useEffect(() => {
    if (!match) return;

    const currentStatus =
      match.fixture.status.short.toUpperCase();

    const isScheduledStatus = ["NS", "TBD"].includes(currentStatus);
    if (!LIVE_STATUSES.includes(currentStatus) && !isScheduledStatus) return;

    // Check upcoming fixtures periodically so the countdown switches to
    // the official live status as soon as the provider reports kickoff.
    const intervalMs = 60000;

    let cancelled = false;

    const refreshMatchStatus = async () => {
      if (statusRefreshInFlight.current) return;

      statusRefreshInFlight.current = true;

      try {
        const response = await fetch(
          `/api/football/match-status?id=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        const data: MatchStatusResponse = await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.status ||
          !data.goals
        ) {
          throw new Error(
            getErrorMessage(data.error) ||
              "Unable to retrieve the latest score."
          );
        }

        if (cancelled) return;

        const refreshedStatus = data.status.short.toUpperCase();
        const refreshedScore = {
          home: data.goals.home,
          away: data.goals.away,
        };
        const finishedStatuses = ["FT", "AET", "PEN"];

        setMatch((currentMatch) => {
          if (!currentMatch) return currentMatch;

          return {
            ...currentMatch,
            fixture: {
              ...currentMatch.fixture,
              status: data.status!,
            },
            goals: data.goals!,
            score: {
              ...currentMatch.score,
              ...(refreshedStatus === "HT"
                ? { halftime: refreshedScore }
                : {}),
              ...(finishedStatuses.includes(refreshedStatus)
                ? { fulltime: refreshedScore }
                : {}),
            },
          };
        });

        // Events are only refreshed while the Overview tab is selected.
        // The score/status refresh remains successful if event retrieval fails.
        if (
          activeTabRef.current === "overview" &&
          EVENT_ELIGIBLE_STATUSES.includes(refreshedStatus)
        ) {
          try {
            const eventsResponse = await fetch(
              `/api/football/match-events?id=${encodeURIComponent(id)}`,
              { cache: "no-store" }
            );
            const eventsData: {
              success?: boolean;
              events?: MatchEvent[];
            } = await eventsResponse.json();

            if (
              eventsResponse.ok &&
              eventsData.success &&
              Array.isArray(eventsData.events)
            ) {
              setMatch((currentMatch) => {
                if (
                  !currentMatch ||
                  String(currentMatch.fixture.id) !== id
                ) {
                  return currentMatch;
                }

                return {
                  ...currentMatch,
                  events: eventsData.events!,
                };
              });
            }
          } catch {
            // Keep the existing event timeline if event refresh fails.
          }
        }

        setStatusRefreshError("");
      } catch (refreshError) {
        if (!cancelled) {
          setStatusRefreshError(
            getErrorMessage(refreshError)
          );
        }
      } finally {
        statusRefreshInFlight.current = false;
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshMatchStatus();
      }
    };

    const interval = window.setInterval(
      refreshWhenVisible,
      intervalMs
    );
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [id, match?.fixture.status.short]);

  useEffect(() => {
    if (!match || activeTab !== "overview") return;

    const homeId = match.teams.home.id;
    const awayId = match.teams.away.id;
    const requestKey = `team-form:${homeId}:${awayId}`;
    if (loadedMatchData.current.has(requestKey)) return;

    let cancelled = false;
    setTeamFormLoading(true);
    setTeamFormError("");

    fetch(`/api/football/team-form?home=${homeId}&away=${awayId}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error("Recent form unavailable.");
        }
        if (!cancelled) {
          loadedMatchData.current.add(requestKey);
          setTeamForm({ home: data.home || [], away: data.away || [] });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTeamForm(null);
          setTeamFormError("Recent form could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setTeamFormLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, match?.teams.home.id, match?.teams.away.id]);

  useEffect(() => {
    if (!match || activeTab !== "statistics") return;

    const homeId = match.teams.home.id;
    const awayId = match.teams.away.id;
    const requestKey = `head-to-head:${homeId}:${awayId}`;
    if (loadedMatchData.current.has(requestKey)) return;

    let cancelled = false;
    setHeadToHeadLoading(true);
    setHeadToHeadError("");

    fetch(`/api/football/head-to-head?home=${homeId}&away=${awayId}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error("Head-to-head unavailable.");
        }
        if (!cancelled) {
          loadedMatchData.current.add(requestKey);
          setHeadToHead(data.matches || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHeadToHead([]);
          setHeadToHeadError("Previous meetings could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setHeadToHeadLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, match?.teams.home.id, match?.teams.away.id]);

  useEffect(() => {
    if (
      !match ||
      activeTab !== "table" ||
      !match.league.id ||
      !match.league.season
    ) {
      return;
    }

    const leagueId = match.league.id;
    const season = match.league.season;
    const requestKey = `standings:${leagueId}:${season}`;
    if (loadedMatchData.current.has(requestKey)) return;

    let cancelled = false;
    setTableError("");
    setStandingsLoading(true);

    fetch(`/api/football/standings?league=${leagueId}&season=${season}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error("Competition table is unavailable.");
        }
        const rows = data.standings?.[0] || [];
        if (!cancelled) {
          loadedMatchData.current.add(requestKey);
          setStandings(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTableError("Unable to load data right now. Please try again later.");
        }
      })
      .finally(() => {
        if (!cancelled) setStandingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, match?.league.id, match?.league.season]);

  useEffect(() => {
    if (!match || activeTab !== "news") return;

    const homeName = match.teams.home.name;
    const awayName = match.teams.away.name;
    const leagueName = match.league.name;
    const requestKey = `news:${homeName}:${awayName}:${leagueName}`.toLowerCase();
    if (loadedMatchData.current.has(requestKey)) return;

    let cancelled = false;
    setNewsLoading(true);
    setNewsError("");

    fetch("/api/football/news", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error("Football news is unavailable.");
        }

        const terms = [homeName, awayName, leagueName].map((term) =>
          term.toLowerCase()
        );
        const relevant = (data.articles || [])
          .filter((article: { title?: string; summary?: string }) => {
            const articleText = `${article.title || ""} ${article.summary || ""}`.toLowerCase();
            return terms.some(
              (term) => term.length > 2 && articleText.includes(term)
            );
          })
          .slice(0, 10);

        if (!cancelled) {
          loadedMatchData.current.add(requestKey);
          setMatchNews(relevant);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMatchNews([]);
          setNewsError("Related football news could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setNewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, match?.teams.home.name, match?.teams.away.name, match?.league.name]);

  const isLive = match
    ? LIVE_STATUSES.includes(match.fixture.status.short.toUpperCase())
    : false;
  const isScheduled = match && ["NS", "TBD"].includes(match.fixture.status.short.toUpperCase());
  const kickoffTime = match ? new Date(match.fixture.date).getTime() : 0;
  const remaining = Math.max(0, kickoffTime - now);
  const countdown = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-NG", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    });

  const getMatchTime = () => {
    if (!match) return "";

    const status = match.fixture.status;

    if (isLive && status.elapsed !== null) {
      return `${status.elapsed}'${
        status.extra ? ` + ${status.extra}` : ""
      }`;
    }

    return status.long;
  };

  if (loading) {
    return (
      <main className="match-centre-shell min-h-screen bg-[#070f1b] text-white">
        <Header />
        <div className="flex min-h-[65vh] items-center justify-center px-5">
          <div className="text-center">
            <div className="relative mx-auto mb-6 h-14 w-14">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <div className="absolute inset-2 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              Preparing your Match Centre
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Fetching match information...
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error && !match) {
    return (
      <main className="match-centre-shell min-h-screen bg-[#070f1b] text-white">
        <Header />
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-2xl">
            !
          </div>
          <h1 className="mb-3 text-2xl font-black">
            Match Information Unavailable
          </h1>
          <p className="mb-8 text-sm text-slate-400">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void loadMatch()}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/5"
            >
              Return Home
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!match) return null;

  const homeTeam = match.teams.home.name;
  const awayTeam = match.teams.away.name;

  const events = match.events ?? [];
  const lineups = match.lineups ?? [];
  const statistics = match.statistics ?? [];
  const players = match.players ?? [];

  const statisticRows = getStatisticRows(
    statistics,
    homeTeam,
    awayTeam
  );

  const failedDiagnostics = Object.values(
    diagnostics ?? {}
  ).filter((item) => item && !item.success);

  const statusCode = match.fixture.status.short.toUpperCase();
  const isFinished = ["FT", "AET", "PEN", "AWD", "WO"].includes(statusCode);
  const isPostponed = statusCode === "PST";
  const isCancelled = ["CANC", "ABD"].includes(statusCode);
  const isDisrupted = ["SUSP", "INT", "INTERRUPTED"].includes(statusCode);

  return (
    <main className="match-centre-shell min-h-screen bg-[#070f1b] text-white">
      <Header />

      <div className="match-centre-content mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-emerald-400"
          >
            <span>←</span>
            Back to LiveScore
          </Link>

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Match Centre
          </div>
        </div>

        {/* MATCH SCOREBOARD */}
        <section className="relative mb-7 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101d2d] shadow-2xl shadow-black/20">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-blue-500" />
          <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-blue-500/[0.06] blur-3xl" />

          <div className="relative px-4 py-7 sm:px-8 sm:py-9 lg:px-12">
            {/* Competition */}
            <div className="mb-8 flex flex-col items-center text-center">
              {match.league.logo && (
                <img
                  src={match.league.logo}
                  alt={match.league.name}
                  className="mb-3 h-12 w-12 object-contain"
                />
              )}

              <p className="text-sm font-bold text-white">
                {match.league.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {match.league.country}
                {match.league.round
                  ? ` · ${match.league.round}`
                  : ""}
              </p>
            </div>

            {/* Teams and score */}
            <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-8">
              <div className="min-w-0 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2 sm:h-24 sm:w-24 sm:rounded-3xl sm:p-4">
                  <img
                    src={match.teams.home.logo}
                    alt={homeTeam}
                    className="h-full w-full object-contain"
                  />
                </div>

                <Link
                  href={`/team/${match.teams.home.id}`}
                  title={`View ${homeTeam} team profile`}
                  className="break-words text-sm font-black text-white transition hover:text-emerald-400 sm:text-xl lg:text-2xl"
                >
                  {homeTeam}
                </Link>

                {match.teams.home.winner && (
                  <span className="mt-2 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-black tracking-wider text-emerald-400">
                    WINNER
                  </span>
                )}
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Home
                </p>
              </div>

              <div className="min-w-[110px] text-center sm:min-w-[190px]">
                <div className="flex items-center justify-center gap-2 text-4xl font-black tracking-tighter text-white sm:gap-4 sm:text-6xl lg:text-7xl">
                  <span>{match.goals.home ?? "-"}</span>
                  <span className="text-slate-600">:</span>
                  <span>{match.goals.away ?? "-"}</span>
                </div>

                <div className="mt-4 flex justify-center">
                  {isLive ? (
                    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${
                      isDisrupted
                        ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                        : "border border-red-500/20 bg-red-500/10 text-red-400"
                    }`}>
                      <span className={`h-2 w-2 animate-pulse rounded-full ${isDisrupted ? "bg-amber-400" : "bg-red-500"}`} />
                      {getMatchTime()}
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-4 py-2 text-xs font-bold ${
                        isCancelled
                          ? "border border-red-500/20 bg-red-500/10 text-red-300"
                          : isPostponed
                            ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                            : isFinished
                              ? "border border-slate-700 bg-slate-800 text-slate-300"
                              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {getMatchTime()}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-[10px] leading-relaxed text-slate-500 sm:text-xs">
                  {formatDate(match.fixture.date)}
                </p>

                {isScheduled && remaining > 0 && (
                  <div className="mx-auto mt-4 grid max-w-[260px] grid-cols-4 gap-2">
                    {[
                      { label: "Days", value: countdown.days },
                      { label: "Hours", value: countdown.hours },
                      { label: "Minutes", value: countdown.minutes },
                      { label: "Seconds", value: countdown.seconds },
                    ].map((unit) => (
                      <div
                        key={unit.label}
                        className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-2 py-2"
                      >
                        <p className="text-lg font-black tabular-nums text-emerald-300">
                          {String(unit.value).padStart(2, "0")}
                        </p>
                        <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                          {unit.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-w-0 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2 sm:h-24 sm:w-24 sm:rounded-3xl sm:p-4">
                  <img
                    src={match.teams.away.logo}
                    alt={awayTeam}
                    className="h-full w-full object-contain"
                  />
                </div>

                <Link
                  href={`/team/${match.teams.away.id}`}
                  title={`View ${awayTeam} team profile`}
                  className="break-words text-sm font-black text-white transition hover:text-blue-400 sm:text-xl lg:text-2xl"
                >
                  {awayTeam}
                </Link>

                {match.teams.away.winner && (
                  <span className="mt-2 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-black tracking-wider text-emerald-400">
                    WINNER
                  </span>
                )}
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                  Away
                </p>
              </div>
            </div>

            {/* Match information */}
            <div className="mt-8 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-black/10 px-4 py-3 text-center">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  Venue
                </p>
                <p className="text-xs font-semibold text-slate-300">
                  {match.fixture.venue.name || "Venue unavailable"}
                </p>
                {match.fixture.venue.city && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    {match.fixture.venue.city}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-black/10 px-4 py-3 text-center">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  Half-time
                </p>
                <p className="text-lg font-black text-white">
                  {match.score.halftime.home ?? "-"}
                  <span className="mx-2 text-slate-600">:</span>
                  {match.score.halftime.away ?? "-"}
                </p>
              </div>

              <div className="rounded-xl bg-black/10 px-4 py-3 text-center">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  Full-time
                </p>
                <p className="text-lg font-black text-white">
                  {match.score.fulltime.home ?? "-"}
                  <span className="mx-2 text-slate-600">:</span>
                  {match.score.fulltime.away ?? "-"}
                </p>
              </div>
              <div className="rounded-xl bg-black/10 px-4 py-3 text-center">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  Referee
                </p>
                <p className="text-xs font-semibold text-slate-300">
                  {match.fixture.referee || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </section>

{activeTab === "overview" && (
        <>
        {/* RECENT FORM */}
        <section className="mb-7 rounded-2xl border border-white/[0.07] bg-[#101d2d] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Team performance</p>
              <h2 className="mt-1 text-lg font-black">Last five matches</h2>
            </div>
            {isScheduled && remaining > 0 && (
              <div className="flex gap-2 text-center">
                {Object.entries(countdown).map(([unit, value]) => (
                  <div key={unit} className="min-w-12 rounded-lg bg-[#0b1624] px-2 py-2">
                    <div className="text-lg font-black text-emerald-400">{String(value).padStart(2,"0")}</div>
                    <div className="text-[8px] font-bold uppercase text-slate-500">{unit}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {([{id:match.teams.home.id, name:homeTeam, form:teamForm?.home}, {id:match.teams.away.id, name:awayTeam, form:teamForm?.away}] as const).map((team) => (
              <div key={team.id} className="rounded-xl bg-[#0b1624] p-4">
                <p className="mb-3 text-sm font-bold text-white"><Link href={`/team/${team.id}`} className="transition-colors hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">{team.name}</Link></p>
                <div className="flex min-h-8 flex-wrap items-center gap-2">
                  {teamFormLoading ? (
                    <span className="text-xs text-slate-500">Loading recent results...</span>
                  ) : team.form?.length ? (
                    team.form.map((game) => (
                      <Link
                        key={game.id}
                        href={`/match/${game.id}`}
                        title={`${game.result} vs ${game.opponent} · ${game.goalsFor ?? "—"}-${game.goalsAgainst ?? "—"} · View match`}
                        aria-label={`View match: ${team.name} ${game.goalsFor ?? "—"}-${game.goalsAgainst ?? "—"} ${game.opponent}, result ${game.result}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white transition hover:scale-110 hover:ring-2 hover:ring-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${game.result === "W" ? "bg-emerald-600" : game.result === "L" ? "bg-red-600" : "bg-amber-500"}`}
                      >
                        {game.result}
                      </Link>
                    ))
                  ) : teamFormError ? (
                    <span className="text-xs text-amber-300">{teamFormError}</span>
                  ) : (
                    <span className="text-xs text-slate-500">Recent results unavailable</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        </>
      )}

        {/* REFRESH FEEDBACK */}
        {error && match && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            Unable to load data right now. Please try again later. Previously retrieved match information is still displayed.
          </div>
        )}

        {statusRefreshError && (
          <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-300">
            Unable to load data right now. Please try again later. The last successfully retrieved score remains displayed.
          </div>
        )}

{activeTab === "overview" && (
        <>
        {/* MATCH INSIGHTS */}
        <section className="mb-7">
          <MatchInsights
            events={events}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamId={match.teams.home.id}
            awayTeamId={match.teams.away.id}
            homeGoals={match.goals.home}
            awayGoals={match.goals.away}
            status={match.fixture.status.short}
            elapsed={match.fixture.status.elapsed}
          />
        </section>

        {/* MATCH NOTIFICATIONS */}
        <section className="mb-8">
          <MatchNotifications
            matchId={id}
            events={events}
            status={match.fixture.status.short}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        </section>

        </>
      )}

        {/* CONTENT NAVIGATION */}
        <section className="mb-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                Match coverage
              </p>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                Match Centre
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleShareMatch()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-300"
              >
                <span aria-hidden="true">↗</span>
                Share match
              </button>
              <button
                type="button"
                onClick={() => void loadMatch(true)}
                disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-emerald-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>
                ↻
              </span>
              {refreshing ? "Refreshing..." : "Refresh match"}
              </button>
            </div>
          </div>
          {shareFeedback && (
            <p className="mt-2 text-right text-xs font-medium text-emerald-400" role="status" aria-live="polite">
              {shareFeedback}
            </p>
          )}

          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#101d2d] p-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition sm:px-5 sm:text-sm ${
                  activeTab === tab.id
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* MATCH EVENTS */}
        {activeTab === "overview" && (
          <section className="rounded-2xl border border-white/[0.07] bg-[#101d2d] p-4 sm:p-6">
            <SectionHeading
              eyebrow="Match overview"
              title="Match Events"
              description="Follow goals, cards, substitutions and important moments."
            />

            <EventTimeline
              events={events}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeTeamId={match.teams.home.id}
              awayTeamId={match.teams.away.id}
            />
          </section>
        )}

        {/* MATCH STATISTICS */}
        {activeTab === "statistics" && (
          <section className="rounded-2xl border border-white/[0.07] bg-[#101d2d] p-4 sm:p-6">
            <SectionHeading
              eyebrow="Numbers that matter"
              title="Match Statistics"
              description="Compare the official statistics recorded for both teams."
            />

            <div className="mb-7 rounded-xl border border-white/[0.06] bg-[#0c1725] p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Recent meetings</p>
                  <h3 className="mt-1 text-base font-black text-white">Head-to-Head</h3>
                </div>
                <span className="text-[10px] text-slate-500">Last 5 completed meetings</span>
              </div>
              {headToHeadLoading ? (
                <p className="py-5 text-center text-sm text-slate-400">Loading previous meetings...</p>
              ) : headToHeadError ? (
                <p className="py-5 text-center text-sm text-amber-300">{headToHeadError}</p>
              ) : headToHead.length === 0 ? (
                <p className="py-5 text-center text-sm text-slate-400">No previous completed meetings were returned for these teams.</p>
              ) : (
                <div className="space-y-2">
                  {headToHead.map((game) => (
                    <div
                      key={game.id}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {game.homeLogo && <img src={game.homeLogo} alt="" className="h-5 w-5 shrink-0 object-contain" />}
                        <Link href={`/team/${game.homeId}`} className="truncate text-xs font-semibold text-slate-200 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">{game.home}</Link>
                      </div>
                      <Link
                        href={`/match/${game.id}`}
                        title={`View match: ${game.home} ${game.homeGoals ?? "—"}–${game.awayGoals ?? "—"} ${game.away}`}
                        aria-label={`Open match centre for ${game.home} versus ${game.away}`}
                        className="text-center rounded-md px-1 py-1 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <p className="text-sm font-black tabular-nums text-white">{game.homeGoals ?? "—"} : {game.awayGoals ?? "—"}</p>
                        <p className="mt-1 text-[9px] text-slate-500">{new Date(game.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" })}</p>
                      </Link>
                      <div className="flex min-w-0 items-center justify-end gap-2">
                        <Link href={`/team/${game.awayId}`} className="truncate text-right text-xs font-semibold text-slate-200 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">{game.away}</Link>
                        {game.awayLogo && <img src={game.awayLogo} alt="" className="h-5 w-5 shrink-0 object-contain" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {statisticRows.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-[#0c1725] py-12 text-center">
                <p className="text-3xl">📊</p>
                <p className="mt-3 text-sm font-semibold text-slate-300">
                  Match statistics are not available
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Statistics may appear when the match data becomes available.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-[#0c1725] p-4 text-center text-xs font-bold">
                  <span className="break-words text-emerald-400">
                    {homeTeam}
                  </span>
                  <span className="text-slate-500">STATISTIC</span>
                  <span className="break-words text-blue-400">
                    {awayTeam}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {statisticRows.map((stat) => (
                    <StatisticComparison
                      key={stat.type}
                      stat={stat}
                    />
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-6 border-t border-white/[0.06] pt-5 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Home team
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Away team
                  </span>
                </div>
              </>
            )}
          </section>
        )}

        {/* PLAYER PERFORMANCE */}
        {activeTab === "players" && (
          <section className="rounded-2xl border border-white/[0.07] bg-[#101d2d] p-4 sm:p-6">
            <SectionHeading
              eyebrow="Individual impact"
              title="Player Performance"
              description="Explore individual player statistics and contributions."
            />

            <PlayerPerformance
              players={players}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          </section>
        )}

        {/* TEAM LINEUPS */}
        {activeTab === "lineups" && (
          <section>
            <SectionHeading
              eyebrow="Official team selections"
              title="Team Lineups"
              description="Confirmed starting XIs, formations, substitutes and coaches. Predicted lineups are shown only when a verified source is available."
            />

            {lineups.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.07] bg-[#101d2d] p-8 text-center">
                <p className="text-3xl">⚽</p>
                <h3 className="mt-4 font-bold text-white">
                  {diagnostics?.lineups && !diagnostics.lineups.success
                    ? "Lineup data unavailable"
                    : isScheduled && remaining > 0
                      ? "Awaiting official lineups"
                      : "Official lineups not provided"}
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  {diagnostics?.lineups && !diagnostics.lineups.success
                    ? "Unable to load data right now. Please try again later."
                    : isScheduled && remaining > 0
                      ? "The teams have not released their official starting XIs yet. Lineups are commonly published closer to kickoff."
                      : "The football data provider has not returned official starting XIs for this match. No predicted players will be presented as confirmed."}
                </p>
                {isScheduled && remaining > 0 && (
                  <p className="mt-4 text-xs font-semibold text-emerald-400">
                    Check again closer to kickoff for confirmed team selections.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {lineups.map((lineup, index) => {
                  const startingPlayers = lineup.startXI ?? [];
                  const substitutes = lineup.substitutes ?? [];

                  return (
                    <div
                      key={`${lineup.team.name}-${index}`}
                      className="rounded-2xl border border-white/[0.07] bg-[#101d2d] p-4 sm:p-6"
                    >
                      <div className="mb-6 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {lineup.team.logo && (
                            <img
                              src={lineup.team.logo}
                              alt={lineup.team.name}
                              className="h-11 w-11 object-contain"
                            />
                          )}
                          <div className="min-w-0">
                            <h3 className="truncate font-black text-white">
                              <Link
                                href={`/team/${lineup.team.id}`}
                                aria-label={`View ${lineup.team.name} team profile`}
                                className="transition-colors hover:text-emerald-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                              >
                                {lineup.team.name}
                              </Link>
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {startingPlayers.length === 11
                                ? "Official starting XI · 11 players"
                                : `Official lineup data · ${startingPlayers.length} starting players`}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400">
                          {lineup.formation || "Formation N/A"}
                        </span>
                      </div>

                      {lineup.coach?.name && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c1725] px-3 py-2.5">
                          {lineup.coach.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={lineup.coach.photo}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs font-black text-emerald-300">
                              CO
                            </span>
                          )}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Head coach
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-white">
                              {lineup.coach.name}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mb-7">
                        <LineupPitch
                          players={startingPlayers}
                          formation={lineup.formation}
                        />
                      </div>

                      <div className="border-t border-white/[0.07] pt-5">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">
                            Substitutes
                          </h4>
                          <span className="text-xs text-slate-500">
                            {substitutes.length} players
                          </span>
                        </div>

                        {substitutes.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No substitute information available.
                          </p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {substitutes.map((item, playerIndex) => (
                              <div
                                key={`${item.player.id}-${playerIndex}`}
                                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-[#0c1725] px-3 py-3 text-sm"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-bold text-slate-400">
                                    {item.player.number}
                                  </span>
                                  <Link
                                    href={`/player/${item.player.id}`}
                                    title={`View ${item.player.name}'s player profile`}
                                    className="truncate font-medium text-slate-200 transition hover:text-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
                                  >
                                    {item.player.name}
                                  </Link>
                                </div>
                                <span className="shrink-0 text-[10px] font-bold text-slate-500">
                                  {item.player.pos}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#101d2d] p-4 sm:p-6">
              <SectionHeading
                eyebrow="Team availability"
                title="Injuries & Suspensions"
                description="Absence reports returned by the football data provider."
              />
              {(match.injuries ?? []).length === 0 ? (
                <p className="rounded-xl bg-[#0c1725] p-5 text-sm text-slate-400">
                  No injury or suspension records were returned for this fixture. This does not necessarily mean both squads are fully available.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {(match.injuries ?? []).map((absence, index) => {
                    const reason = absence.player.reason || "Reason not provided";
                    const category = absence.player.type || "Unavailable";
                    const isSuspension = /suspend/i.test(`${category} ${reason}`);
                    return (
                      <div
                        key={`${absence.player.id}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c1725] p-3"
                      >
                        {absence.team.logo ? (
                          <img src={absence.team.logo} alt="" className="h-9 w-9 object-contain" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-bold text-slate-400">
                            {absence.team.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">
                            <Link
                              href={`/player/${absence.player.id}`}
                              title={`View ${absence.player.name}'s player profile`}
                              className="transition-colors hover:text-emerald-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                            >
                              {absence.player.name}
                            </Link>
                          </p>
                          <p className="truncate text-xs text-slate-400">{absence.team.name} · {reason}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${isSuspension ? "bg-amber-500/10 text-amber-300" : "bg-red-500/10 text-red-300"}`}>
                          {isSuspension ? "Suspended" : category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* MATCH HIGHLIGHTS */}
        {activeTab === "highlights" && (
          <section className="rounded-2xl border border-white/[0.07] bg-[#101d2d] p-4 sm:p-6">
            <SectionHeading
              eyebrow="Watch the action"
              title="Match Highlights"
              description={`Video highlights and coverage for ${homeTeam} vs ${awayTeam}.`}
            />

            <YouTubeHighlights
              kind="all"
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              league={match.league.name}
              limit={6}
            />
          </section>
        )}

        {activeTab === "table" && (
          <section className="rounded-2xl border border-white/[0.07] bg-[#101d2d] p-4 sm:p-6">
            <SectionHeading eyebrow={match.league.name} title="Competition Table" description="Official standings returned by the football data provider." />
            {tableError ? <p className="rounded-xl bg-[#0c1725] p-5 text-sm text-slate-400">{tableError}</p> : standingsLoading ? <p className="rounded-xl bg-[#0c1725] p-5 text-center text-sm text-slate-400" role="status">Loading competition standings...</p> : standings.length === 0 ? <p className="rounded-xl bg-[#0c1725] p-5 text-sm text-slate-400">Standings are not available for this competition or season.</p> : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-xs">
                  <thead className="bg-[#0c1725] text-[10px] uppercase tracking-wider text-slate-500">
                    <tr><th className="p-3">Pos</th><th className="p-3">Club</th><th className="p-3">P</th><th className="p-3">W</th><th className="p-3">D</th><th className="p-3">L</th><th className="p-3">GF</th><th className="p-3">GA</th><th className="p-3">GD</th><th className="p-3">Form</th><th className="p-3">Pts</th></tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => {
                      const isMatchTeam = row.team.id === match.teams.home.id || row.team.id === match.teams.away.id;
                      return (
                        <tr key={row.team.id} className={isMatchTeam ? "border-t border-white/[0.06] bg-emerald-500/[0.07]" : "border-t border-white/[0.06] hover:bg-white/[0.02]"}>
                          <td className="p-3 font-bold text-slate-400">{row.rank}</td>
                          <td className="p-3 font-semibold text-white">
                            <div className="flex items-center gap-2">{row.team.logo && <img src={row.team.logo} alt="" className="h-5 w-5 object-contain" />}<Link href={`/team/${row.team.id}`} className="transition hover:text-emerald-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm" aria-label={`View ${row.team.name} team profile`}>{row.team.name}</Link></div>
                            {row.description && <p className="mt-1 max-w-[220px] text-[9px] font-medium text-emerald-300/80">{row.description}</p>}
                          </td>
                          <td className="p-3">{row.all.played}</td><td className="p-3">{row.all.win}</td><td className="p-3">{row.all.draw}</td><td className="p-3">{row.all.lose}</td>
                          <td className="p-3">{row.all.goals?.for ?? "—"}</td><td className="p-3">{row.all.goals?.against ?? "—"}</td>
                          <td className="p-3 font-semibold">{row.goalsDiff > 0 ? "+" + row.goalsDiff : row.goalsDiff}</td>
                          <td className="p-3">
                            {row.form ? <div className="flex items-center gap-1">{row.form.slice(-5).split("").map((result, index) => <span key={index} title={result} className={result === "W" ? "flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15 text-[9px] font-black text-emerald-300" : result === "D" ? "flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 text-[9px] font-black text-amber-300" : "flex h-5 w-5 items-center justify-center rounded bg-red-500/15 text-[9px] font-black text-red-300"}>{result}</span>)}</div> : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="p-3 font-black text-emerald-400">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                <p className="mt-3 text-[10px] text-slate-500">GF: goals for · GA: goals against · GD: goal difference. Form and qualification notes are supplied by the competition data provider.</p>
              </>
            )}
          </section>
        )}

        {activeTab === "news" && (
          <section className="rounded-2xl border border-white/[0.07] bg-[#101d2d] p-4 sm:p-6">
            <SectionHeading eyebrow="Team coverage" title="Related Football News" description={`Headlines mentioning ${homeTeam}, ${awayTeam} or ${match.league.name}.`} />
            {newsLoading ? <p className="p-8 text-center text-sm text-slate-400">Loading related news...</p> : newsError ? <p className="rounded-xl bg-[#0c1725] p-5 text-sm text-amber-300">{newsError}</p> : matchNews.length === 0 ? <p className="rounded-xl bg-[#0c1725] p-5 text-sm text-slate-400">No related headlines are currently available. Unrelated football stories are hidden.</p> : <div className="grid gap-3 md:grid-cols-2">{matchNews.map((article) => <a key={article.id} href={article.link} target="_blank" rel="noreferrer" className="rounded-xl border border-white/[0.06] bg-[#0c1725] p-4 transition hover:border-emerald-500/30"><p className="text-sm font-bold text-white">{article.title}</p>{article.summary && <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">{article.summary}</p>}<p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400">{article.source} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-NG") : "Latest"}</p></a>)}</div>}
            <div className="mt-6 border-t border-white/[0.06] pt-5"><h3 className="mb-3 text-sm font-bold text-white">Video highlights</h3><YouTubeHighlights kind="all" homeTeam={homeTeam} awayTeam={awayTeam} league={match.league.name} limit={4} /></div>
          </section>
        )}

        {activeTab === "betting" && (
          <MatchOdds matchId={id} />
        )}

        {/* API DATA DIAGNOSTICS */}
        {failedDiagnostics.length > 0 && (
          <section className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.05] p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                !
              </span>
              <h3 className="font-bold text-yellow-400">
                Some Match Information Is Unavailable
              </h3>
            </div>

            <p className="mb-4 text-sm text-slate-400">
              The main match information was retrieved, but some additional
              data could not be loaded.
            </p>

            <div className="space-y-3">
              {failedDiagnostics.map((item) => (
                <div
                  key={item.endpoint}
                  className="rounded-lg bg-black/10 p-3 text-sm"
                >
                  <span className="font-semibold capitalize text-white">
                    {item.endpoint}:
                  </span>
                  <span className="ml-2 text-slate-400">
                    Unable to load data right now. Please try again later.
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}