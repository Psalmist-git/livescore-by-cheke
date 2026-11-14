import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/RecoveryForm";

export const metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1118] px-4 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141e29] p-7 sm:p-10">
        <Link href="/" className="text-xs font-bold text-slate-400 hover:text-emerald-300">← Back to LiveScore</Link>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Secure your account</p>
        <h1 className="mt-2 text-3xl font-black">Choose a new password</h1>
        <p className="mb-8 mt-3 text-sm leading-6 text-slate-400">Create a new password with at least 8 characters.</p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
