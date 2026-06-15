"use client";

import { useState } from "react";
import { Activity, Mail } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Use email magic link or Google when Supabase is connected.");

  async function signInWithEmail() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Add Supabase environment variables to enable authentication.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setMessage(error?.message ?? "Check your email for the My Journey login link.");
  }

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Add Supabase environment variables to enable Google login.");
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="glass w-full max-w-md rounded-[32px] p-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
          <Activity size={22} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold">Sign in to My Journey</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>
        <div className="mt-6 space-y-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-12 w-full rounded-2xl border border-[var(--hairline)] bg-transparent px-4 outline-none"
          />
          <button
            onClick={signInWithEmail}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            <Mail size={16} />
            Email magic link
          </button>
          <button
            onClick={signInWithGoogle}
            className="h-12 w-full rounded-2xl border border-[var(--hairline)] text-sm font-medium"
          >
            Continue with Google
          </button>
        </div>
      </section>
    </main>
  );
}
