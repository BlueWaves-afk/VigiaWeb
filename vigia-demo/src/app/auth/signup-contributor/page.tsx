// src/app/auth/signin/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/lib/auth";

export default function SignInPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn(email, pwd);
    r.replace("/onboarding");
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-md px-6 pt-28">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          <p className="mt-2 text-slate-300/90">Welcome back to VIGIA.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button className="w-full rounded-xl bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-100">
              Continue
            </button>
          </form>
          <div className="mt-4 text-sm text-slate-300/80">
            New contributor?{" "}
            <a href="/auth/signup-contributor" className="text-cyan-300 hover:underline">
              Sign up as contributor
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}