"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const leagues = [
  { name: "Premier League", id: 39 },
  { name: "La Liga", id: 140 },
  { name: "Bundesliga", id: 78 },
  { name: "Serie A", id: 135 },
  { name: "Ligue 1", id: 61 },
  { name: "Champions League", id: 2 },
  { name: "Europa League", id: 3 },
];

const quickLinks = [
  { label: "Live Scores", href: "/live", icon: "◉" },
  { label: "Fixtures", href: "/fixtures", icon: "▦" },
  { label: "All Leagues", href: "/leagues", icon: "♜" },
  { label: "Teams", href: "/teams", icon: "⚽" },
  { label: "News", href: "/news", icon: "▤" },
  { label: "Highlights", href: "/highlights", icon: "▶" },
  { label: "Favourites", href: "/favourites", icon: "♥" },
  { label: "Search", href: "/search", icon: "⌕" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <aside className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#151f2b]">
        <div className="border-b border-white/5 px-4 py-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            Explore
          </h2>
        </div>

        <nav aria-label="Sidebar navigation" className="p-2">
          {quickLinks.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "border-emerald-400 bg-emerald-500/10 text-emerald-400"
                    : "border-transparent text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                }`}
              >
                <span className="w-5 text-center text-emerald-400">
                  {item.icon}
                </span>

                {item.label}
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#151f2b]">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            Popular Competitions
          </h2>

          <Link
            href="/leagues"
            className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
          >
            All →
          </Link>
        </div>

        <div className="p-2">
          {leagues.map((league, index) => (
            <Link
              key={league.id}
              href={`/leagues?league=${league.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#243444] text-xs font-black text-emerald-400">
                {index + 1}
              </span>

              <span>{league.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950 to-[#151f2b] p-5">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
          LiveScore by Cheke
        </p>

        <h2 className="mt-3 text-xl font-black leading-tight text-white">
          Every sport.
          <br />
          Every moment.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          Your destination for live scores, fixtures, competitions and
          everything happening in the world of sports.
        </p>

        <Link
          href="/live"
          className="mt-5 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-[#101820] transition hover:bg-emerald-400"
        >
          Explore Live Scores →
        </Link>
      </section>
    </aside>
  );
}