import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your LiveScore by Cheke account.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1118] px-4 py-12 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#141e29] shadow-2xl shadow-black/30 md:grid-cols-[1fr_0.9fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#123b2b] via-[#102a27] to-[#101820] p-10 md:flex">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[45px] border-emerald-300/10" />
          <Link href="/" className="relative text-xl font-black tracking-tight">LIVE<span className="text-emerald-400">SCORE</span><span className="ml-2 text-[10px] tracking-[0.25em] text-slate-300">BY CHEKE</span></Link>
          <div className="relative">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Your football world</p>
            <h1 className="text-4xl font-black leading-tight">The game never stops. Neither should you.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">Sign in to keep your favourite teams, competitions and match-day experience close.</p>
          </div>
          <p className="relative text-xs text-slate-500">Every Match. Every Goal. Every Moment.</p>
        </section>

        <section className="p-6 sm:p-10">
          <Link href="/" className="text-xs font-bold text-slate-400 transition hover:text-emerald-300">← Back to LiveScore</Link>
          <div className="mb-8 mt-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Welcome back</p>
            <h2 className="mt-2 text-3xl font-black">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Access your personalised football experience.</p>
          </div>
          <AuthForm mode="login" />
        </section>
      </div>
    </main>
  );
}
