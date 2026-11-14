"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (isRegister && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);

    try {
      const supabase = createClient();

      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          router.push("/account");
          router.refresh();
        } else {
          setNotice("Your account has been created. Check your email for the confirmation link before signing in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        router.push("/account");
        router.refresh();
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Authentication could not be completed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isRegister && (
        <div>
          <label htmlFor="display-name" className="mb-2 block text-sm font-semibold text-slate-200">Full name</label>
          <input
            id="display-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-white/10 bg-[#0c151e] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-200">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-white/10 bg-[#0c151e] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          className="w-full rounded-xl border border-white/10 bg-[#0c151e] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
        />
      </div>

      {isRegister && (
        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-200">Confirm password</label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter your password again"
            className="w-full rounded-xl border border-white/10 bg-[#0c151e] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
          />
        </div>
      )}

      {!isRegister && (
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">Forgot password?</Link>
        </div>
      )}

      {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm leading-6 text-emerald-200">{notice}</p>}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-[#07130e] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Please wait..." : isRegister ? "Create your account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-400">
        {isRegister ? "Already have an account? " : "New to LiveScore by Cheke? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-bold text-emerald-300 hover:text-emerald-200">
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
