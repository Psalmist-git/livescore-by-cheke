"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export default function AuthNavigation() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return;
    }

    let active = true;
    let supabase: ReturnType<typeof createClient>;

    try {
      supabase = createClient();
    } catch {
      // Authentication is optional: keep public navigation available.
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (active) setSignedIn(Boolean(session?.user));
    });

    // Do not hold up the header while Supabase checks the session.
    // Visitors can browse the entire public application immediately.
    void supabase.auth
      .getUser()
      .then(({ data }: { data: { user: User | null } }) => {
        if (active) setSignedIn(Boolean(data.user));
      })
      .catch(() => {
        if (active) setSignedIn(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (signedIn) {
    return (
      <Link
        href="/account"
        className="rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/10 sm:px-4 sm:text-sm"
      >
        My Account
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-emerald-400/40 hover:text-white sm:px-4 sm:text-sm"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-black text-[#101820] transition hover:bg-emerald-300 sm:px-4 sm:text-sm"
      >
        Join free
      </Link>
    </div>
  );
}
