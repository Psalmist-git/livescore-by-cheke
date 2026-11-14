"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-60"
    >
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
