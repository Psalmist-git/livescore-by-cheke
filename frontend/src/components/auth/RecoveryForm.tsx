"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice("If an account exists for that email, a password reset link has been sent.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to request a password reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-200">Email address</label>
        <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-[#0c151e] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400" />
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm leading-6 text-emerald-200">{notice}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-[#07130e] hover:bg-emerald-300 disabled:opacity-60">{busy ? "Sending..." : "Send reset link"}</button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Your passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace("/account");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your password. Request a new reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-200">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0c151e] px-4 py-3.5 text-sm text-white outline-none focus:border-emerald-400" />
      </div>
      <div>
        <label htmlFor="confirm-new-password" className="mb-2 block text-sm font-semibold text-slate-200">Confirm new password</label>
        <input id="confirm-new-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0c151e] px-4 py-3.5 text-sm text-white outline-none focus:border-emerald-400" />
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-[#07130e] hover:bg-emerald-300 disabled:opacity-60">{busy ? "Updating..." : "Update password"}</button>
    </form>
  );
}
