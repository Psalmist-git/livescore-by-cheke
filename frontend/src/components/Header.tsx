"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthNavigation from "@/components/auth/AuthNavigation";

const navLinks = [
  { label: "Home", href: "/" }, { label: "Live", href: "/live" },
  { label: "Fixtures", href: "/fixtures" }, { label: "Leagues", href: "/leagues" },
  { label: "Teams", href: "/teams" }, { label: "News", href: "/news" },
  { label: "Highlights", href: "/highlights" }, { label: "Search", href: "/search" },
  { label: "Favourites", href: "/favourites" },
];
const mobileLinks = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Live", href: "/live", icon: "●" },
  { label: "Fixtures", href: "/fixtures", icon: "▦" },
  { label: "Favourites", href: "/favourites", icon: "♥" },
  { label: "Leagues", href: "/leagues", icon: "♜" },
];
function isCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
function PrimaryNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary navigation" className="desktop-primary-navigation border-t border-white/[0.06]">
      <div className="mobile-nav-scroll mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-3 py-2 sm:px-6">
        {navLinks.map((item) => {
          const active = isCurrent(pathname, item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${active ? "bg-emerald-500/10 text-emerald-300" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>
            {item.label}
          </Link>;
        })}
      </div>
    </nav>
  );
}
function NavigationFallback() {
  return <nav aria-label="Primary navigation" className="desktop-primary-navigation border-t border-white/[0.06]">
    <div className="mobile-nav-scroll mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-3 py-2 sm:px-6">
      {navLinks.map((item) => <Link key={item.href} href={item.href} className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400">{item.label}</Link>)}
    </div>
  </nav>;
}
function MobileBottomNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Mobile navigation" className="mobile-bottom-nav">
    {mobileLinks.map((item) => {
      const active = isCurrent(pathname, item.href);
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
        <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
      </Link>;
    })}
  </nav>;
}
export default function Header() {
  return <>
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#101820]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-4 py-4 sm:px-6">
        <Link href="/" className="group shrink-0" aria-label="LiveScore by Cheke home">
          <div className="text-xl font-black tracking-tighter text-white sm:text-2xl">LIVE<span className="text-emerald-400">SCORE</span></div>
          <div className="mt-1 text-[9px] font-bold tracking-[0.35em] text-slate-400">BY CHEKE</div>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/search" className="hidden rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400 sm:block">Search</Link>
          <Link href="/favourites" className="hidden rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-[#101820] transition hover:bg-emerald-400 sm:block sm:px-4 sm:text-sm">♥ Favourites</Link>
          <AuthNavigation />
        </div>
      </div>
      <Suspense fallback={<NavigationFallback />}><PrimaryNavigation /></Suspense>
    </header>
    <Suspense fallback={null}><MobileBottomNavigation /></Suspense>
  </>;
}
