import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Your account",
  description: "Manage your LiveScore by Cheke account.",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/login?next=/account");

  const displayName =
    typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : user.email?.split("@")[0] ?? "Football fan";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[#0b1118] px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-bold text-slate-400 transition hover:text-emerald-300">← Back to LiveScore</Link>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#141e29]">
          <div className="bg-gradient-to-r from-[#123b2b] to-[#142632] p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Your account</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-black text-[#07130e]">{initial}</div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black sm:text-3xl">Welcome, {displayName}</h1>
                <p className="mt-1 break-all text-sm text-slate-300">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-black">Your football experience</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Your favourite teams and followed competitions sync to this account, so your match-day preferences stay with you when you sign in on another device. Guest favourites are merged when you sign in.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/favourites" className="rounded-xl border border-white/10 bg-[#0c151e] p-4 transition hover:border-emerald-400/40">
                <span className="text-xl">♥</span>
                <h3 className="mt-2 font-bold">Favourite teams</h3>
                <p className="mt-1 text-xs text-slate-500">See the teams you follow.</p>
              </Link>
              <Link href="/leagues#followed-competitions" className="rounded-xl border border-white/10 bg-[#0c151e] p-4 transition hover:border-emerald-400/40">
                <span className="text-xl">🏆</span>
                <h3 className="mt-2 font-bold">Competitions</h3>
                <p className="mt-1 text-xs text-slate-500">See and manage the competitions you follow.</p>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <p className="text-xs text-slate-500">Signed in securely with Supabase.</p>
              <SignOutButton />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
