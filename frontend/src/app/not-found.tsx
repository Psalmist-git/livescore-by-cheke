import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070f1b] px-5 py-16 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#101d2d] p-7 text-center sm:p-10">
        <p className="text-6xl font-black tracking-tighter text-emerald-400">404</p>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
          LiveScore by Cheke
        </p>
        <h1 className="mt-3 text-2xl font-black">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The page or match you are looking for may have moved or may no longer be available.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
          >
            Back to Live Scores
          </Link>
          <Link
            href="/fixtures"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/5"
          >
            Browse Fixtures
          </Link>
        </div>
      </section>
    </main>
  );
}
