"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function StartupSplash() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The branded intro is only for the public home page. It must never
    // cover login, registration, match pages, or other public routes.
    if (pathname !== "/") {
      setVisible(false);
      return;
    }

    try {
      if (sessionStorage.getItem("livescore-splash-shown") === "yes") {
        // Explicitly hide on subsequent effect runs (including React
        // Strict Mode's development setup/cleanup cycle).
        setVisible(false);
        return;
      }

      sessionStorage.setItem("livescore-splash-shown", "yes");
    } catch {
      // Continue normally if browser storage is unavailable.
    }

    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visible || pathname !== "/") {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Loading LiveScore by Cheke"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030907] px-6 transition-opacity"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,201,130,0.13),_transparent_65%)]" />

      <div className="relative flex flex-col items-center">
        <Image
          src="/brand/livescore-logo.svg"
          alt="LiveScore by Cheke"
          width={420}
          height={122}
          priority
          className="h-auto w-[min(82vw,360px)]"
        />

        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 sm:text-sm">
          Every sport. Every moment.
        </p>

        <div className="mt-10 flex items-center gap-3" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)] animate-[synchronized-bounce_0.7s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{ animationDelay: `${dot * 0.18}s` }}
            />
          ))}
        </div>

        <p className="mt-4 text-[10px] font-medium tracking-[0.2em] text-slate-500">
          LOADING YOUR SPORTS WORLD
        </p>
      </div>

      <style jsx>{`
        @keyframes synchronized-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
      `}</style>
    </div>
  );
}
