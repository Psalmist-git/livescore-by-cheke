"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application rendering error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070f1b] px-5 py-16 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#101d2d] p-7 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-2xl text-amber-300" aria-hidden="true">
          !
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
          LiveScore by Cheke
        </p>
        <h1 className="mt-3 text-2xl font-black">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          This page could not be displayed. You can try loading it again or return to the live scores.
        </p>
        {error.digest && (
          <p className="mt-3 text-[10px] text-slate-600">Reference: {error.digest}</p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="min-h-11 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/5"
          >
            Back to Live Scores
          </Link>
        </div>
      </section>
    </main>
  );
}
