// src/app/auth/signup/page.tsx
"use client";

import { Suspense } from "react";
import { signUp } from "@/lib/auth";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-slate-300">Loading…</div>}>
      <SignUpInner />
    </Suspense>
  );
}

function SignUpInner() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const error = searchParams.get("error");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.05),transparent_50%)] bg-[length:200%_200%]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full max-w-md">
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur-xl md:p-10"
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(80%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]" />

            <div className="relative">
              <motion.div variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }} className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 p-3 ring-1 ring-white/10"
                  >
                    <Sparkles className="h-6 w-6 text-sky-300" />
                  </motion.div>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    Get started
                  </span>
                </h1>
                <p className="mt-2 text-sm text-slate-400">Create your VIGIA account in seconds</p>
              </motion.div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                  <p className="text-sm text-emerald-300">{message}</p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}

              <form action={signUp} className="space-y-5">
                <motion.div variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }}>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none ring-0 transition-all focus:border-sky-500/50 focus:bg-white/10 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }}>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none ring-0 transition-all focus:border-sky-500/50 focus:bg-white/10 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Must be at least 8 characters</p>
                </motion.div>

                <motion.div variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }} className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 font-medium text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-xl hover:shadow-sky-500/40"
                  >
                    Create Account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </motion.div>

                <motion.p variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center text-xs text-slate-500">
                  By signing up, you agree to our{" "}
                  <motion.a whileHover={{ x: 1 }} href="/terms" className="inline-block text-sky-400 transition-colors hover:text-sky-300">
                    Terms of Service
                  </motion.a>{" "}
                  and{" "}
                  <motion.a whileHover={{ x: 1 }} href="/privacy" className="inline-block text-sky-400 transition-colors hover:text-sky-300">
                    Privacy Policy
                  </motion.a>
                </motion.p>
              </form>

              <motion.div variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }} className="mt-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black/30 px-4 text-slate-500">Already have an account?</span>
                  </div>
                </div>
                <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/auth/signin"
                  className="mt-4 inline-block rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/10">
                  Sign in instead
                </motion.a>
              </motion.div>
            </div>
          </motion.div>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto mt-6 h-px w-32 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]" />
        </motion.div>
      </div>
    </div>
  );
}