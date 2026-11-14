"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeamFavouriteButton from "@/components/TeamFavouriteButton";

interface Team {
  id: number;
  name: string;
  code: string | null;
  country: string | null;
  founded: number | null;
  national: boolean;
  logo: string;
}
interface Venue {
  name: string | null;
  city: string | null;
  capacity: number | null;
  image: string | null;
  address?: string | null;
}
interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
    venue?: { name: string | null; city: string | null };
  };
  league: { name: string; logo?: string; round?: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}
const finished = ["FT", "AET", "PEN"];
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function TeamProfileContent() {
  const params = useParams<{ id: string }>();
  const teamId = params.id;
  const [team, setTeam] = useState<Team | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!teamId || !/^\d+$/.test(teamId)) {
      setError("A valid team could not be identified.");
      setLoading(false);
      return;
    }

    let active = true;
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");
        const [profileResponse, fixturesResponse] = await Promise.all([
          fetch(`/api/football/team-profile?id=${encodeURIComponent(teamId)}`),
          fetch(`/api/football/team-fixtures?team=${encodeURIComponent(teamId)}`),
        ]);
        const [profileData, fixturesData] = await Promise.all([
          profileResponse.json(),
          fixturesResponse.json(),
        ]);
        if (!profileResponse.ok || !profileData.success) {
          throw new Error(profileData.error || "Unable to load team profile.");
        }
        if (!fixturesResponse.ok || !fixturesData.success) {
          throw new Error(fixturesData.error || "Unable to load team fixtures.");
        }
        if (active) {
          setTeam(profileData.team);
          setVenue(profileData.venue);
          setFixtures(fixturesData.matches || []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load team profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [teamId]);

  const recent = useMemo(
    () => fixtures.filter((match) => finished.includes(match.fixture.status.short))
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
      .slice(0, 5),
    [fixtures]
  );
  const upcoming = useMemo(
    () => fixtures.filter((match) => !finished.includes(match.fixture.status.short) && match.fixture.status.short !== "PST" && match.fixture.status.short !== "CANC")
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
      .slice(0, 5),
    [fixtures]
  );

  function FixtureCard({ match }: { match: Fixture }) {
    const isFinished = finished.includes(match.fixture.status.short);
    return (
      <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-emerald-500/50">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="truncate">{match.league?.name || "Football"}</span>
          <span>{dateLabel(match.fixture.date)}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <img src={match.teams.home.logo} alt="" className="h-7 w-7 object-contain" />
            <Link href={`/team/${match.teams.home.id}`} onClick={(event) => event.stopPropagation()} className="truncate text-sm font-semibold text-slate-200 transition hover:text-emerald-300 hover:underline" aria-label={`View ${match.teams.home.name} team profile`}>{match.teams.home.name}</Link>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-white">
              {isFinished ? `${match.goals.home ?? 0} - ${match.goals.away ?? 0}` : "VS"}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">{isFinished ? "Full time" : match.fixture.status.short === "NS" ? "Upcoming" : match.fixture.status.long}</p>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <Link href={`/team/${match.teams.away.id}`} className="truncate text-right text-sm font-semibold text-slate-200 transition hover:text-emerald-300 hover:underline" aria-label={`View ${match.teams.away.name} team profile`}>{match.teams.away.name}</Link>
            <img src={match.teams.away.logo} alt="" className="h-7 w-7 object-contain" />
          </div>
        </div>
        <div className="mt-4 flex justify-end border-t border-slate-800 pt-3">
          <Link href={`/match/${match.fixture.id}`} className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300">View Match Centre →</Link>
        </div>
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Link href="/teams" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">← Back to Teams</Link>
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading team profile...</div>
          ) : error ? (
            <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">{error}</div>
          ) : team ? (
            <div className="mt-8 flex flex-col gap-7 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border border-slate-700 bg-slate-900 p-4">
                <img src={team.logo} alt={`${team.name} logo`} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">{team.national ? "National Team" : "Club Profile"}</p>
                <h1 className="mt-2 text-3xl font-black sm:text-5xl">{team.name}</h1>
                <p className="mt-3 text-slate-400">{[team.country, team.code].filter(Boolean).join(" • ") || "Team information"}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">Founded: {team.founded || "N/A"}</span>
                  <span className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">{team.national ? "International" : "Club football"}</span>
                  <Link href={`/team-compare?first=${team.id}`} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20">Compare this team →</Link>
                  <TeamFavouriteButton team={team} venue={venue} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {!loading && !error && team && (
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-10">
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Recent results</p><h2 className="mt-2 text-2xl font-black">Last Matches</h2></div>
                <span className="text-xs text-slate-500">Latest completed fixtures</span>
              </div>
              {recent.length ? <div className="space-y-3">{recent.map((match) => <FixtureCard key={match.fixture.id} match={match} />)}</div> : <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">No recent completed matches found.</p>}
            </section>
            <section>
              <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Coming up</p><h2 className="mt-2 text-2xl font-black">Upcoming Fixtures</h2></div>
              {upcoming.length ? <div className="space-y-3">{upcoming.map((match) => <FixtureCard key={match.fixture.id} match={match} />)}</div> : <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">No upcoming fixtures found in the current schedule window.</p>}
            </section>
          </div>
          <aside className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              {venue?.image ? <img src={venue.image} alt={venue.name || "Home stadium"} className="h-44 w-full object-cover" /> : <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-5xl">🏟️</div>}
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Home Ground</p>
                <h2 className="mt-2 text-xl font-bold">{venue?.name || "Venue unavailable"}</h2>
                <p className="mt-2 text-sm text-slate-400">{[venue?.city, venue?.address].filter(Boolean).join(", ") || "Location unavailable"}</p>
                <div className="mt-5 border-t border-slate-800 pt-4"><p className="text-xs text-slate-500">Stadium capacity</p><p className="mt-1 text-lg font-bold">{venue?.capacity ? venue.capacity.toLocaleString() : "N/A"}</p></div>
              </div>
            </section>
            <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Explore more</p>
              <h3 className="mt-2 text-lg font-bold">Compare team performance</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">See how this team measures up against another club or national side.</p>
              <Link href="/team-compare" className="mt-4 inline-flex rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400">Open Team Comparison</Link>
            </section>
          </aside>
        </div>
      )}
      <Footer />
    </main>
  );
}


export default function TeamProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-white">
          <Header />
          <div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate-400">
            Loading team profile...
          </div>
          <Footer />
        </main>
      }
    >
      <TeamProfileContent />
    </Suspense>
  );
}
