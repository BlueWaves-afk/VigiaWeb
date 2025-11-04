// src/app/onboarding/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
// --- FIX: Import the hook and the new server action ---
import { useProfile } from "@/hooks/useProfile";
import { completeOnboarding } from "./actions";
import type { Profile } from "@/hooks/useProfile";
// ---------------------------------------------------

type Step = 0 | 1 | 2;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];
import type { Variants } from "framer-motion";

const containerVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

const stepVariants: Variants = {
  initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: EASE_OUT } },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -40 : 40,
    scale: 0.98,
    transition: { duration: 0.25, ease: EASE_IN },
  }),
};

// A simple loading component (you can replace this)
function LoadingScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center">
      <span className="text-white">Loading...</span>
    </div>
  );
}

export default function Onboarding() {
  const r = useRouter();
  // --- FIX: Use the profile hook ---
  const { profile, loading } = useProfile();
  // -------------------------------

  const [step, setStep] = useState<Step>(0);
  const [dir, setDir] = useState(1); // animation direction
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-clicks
  // --- ADDED: State to hold server errors ---
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // ------------------------------------------

  // --- FIX: Use useEffect to react to profile loading ---
  useEffect(() => {
    if (loading) {
      return; // Still loading, do nothing
    }
    if (!profile) {
      // Not loading, and no profile. Redirect to sign in.
      r.replace("/auth/signin");
      return;
    }
    if (profile.hasOnboarded) {
      // User has already onboarded, send them to the dashboard.
      r.replace("/dashboard");
    }
    // If loading is false, and we have a profile that hasn't onboarded,
    // the component will render.
  }, [profile, loading, r]);
  // ----------------------------------------------------

  const next = useCallback(async () => {
    // Clear previous errors when trying again
    setErrorMessage(null);
    if (isSubmitting) return; // Don't allow action while one is in progress

    if (step < 2) {
      setDir(1);
      setStep((s) => (s + 1) as Step);
      return;
    }
    
    // --- FIX: Final step, call the server action ---
    setIsSubmitting(true);
    try {
      // The server action handles the redirect
      await completeOnboarding();
      // If the server action *doesn't* redirect (which it should),
      // we'll be stuck. The redirect is the expected behavior.
    } catch (error: any) {
      console.error(error);
      // --- UPDATED: Show error to user and fix typo ---
      setErrorMessage(error.message || "An unknown error occurred.");
      setIsSubmitting(false); // <-- FIX: Was 'False' (uppercase)
      // ------------------------------------------------
    }
    // ---------------------------------------------
  }, [step, isSubmitting]);

  const prev = useCallback(() => {
    if (step > 0) {
      setDir(-1);
      setStep((s) => (s - 1) as Step);
    }
  }, [step]);

  // keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") next();
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // --- FIX: Show loading screen until profile is loaded/checked ---
  if (loading || !profile || profile.hasOnboarded) {
    return <LoadingScreen />;
  }
  // ----------------------------------------------------------

  // Now we are sure we have a profile that needs onboarding
    // profile shape can vary; try common property names with fallbacks and cast to any
    const vgt =
      (profile as any).tokenBalance ??
      (profile as any).vgt ??
      (profile as any).vgtBalance ??
      (profile as any).token_balance ??
      0;
    const dc =
      (profile as any).dataCredits ??
      (profile as any).data_credits ??
      (profile as any).dc ??
      0;

  const steps: Array<React.ReactNode> = [
    (
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold text-white">
          Welcome to <span className="text-cyan-300">VIGIA</span>
        </h1>
        <p className="text-slate-300">
          VIGIA uses <b>VGT</b> (VIGIA Token) to reward trustworthy hazard reports and powers usage
          via <b>Data Credits (DC)</b>.
        </p>
        <ul className="mt-1 list-disc pl-5 text-slate-300/90 space-y-1">
          <li>Contributors earn VGT for validated hazards (privacy-safe).</li>
          <li>Consumers spend DC for API/SDK calls (USD-denominated).</li>
        </ul>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Your current balances</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-white/10 bg-slate-900/60 p-5"
          >
            <div className="text-slate-400">VGT Tokens</div>
            <div className="mt-2 text-3xl font-semibold text-white">{vgt}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-xl border border-white/10 bg-slate-900/60 p-5"
          >
            <div className="text-slate-400">Data Credits</div>
            <div className="mt-2 text-3xl font-semibold text-white">{dc}</div>
          </motion.div>
        </div>
        <p className="text-slate-300/90">You’ll see these increase as you contribute and top-up.</p>
      </div>
    ),
    (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Before you start</h2>
        <p className="text-slate-300">
          Explore real-time signals, token earnings, and data-credit consumption in your dashboard.
        </p>
      </div>
    ),
  ];

  const progress = ((step + 1) / 3) * 100;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Soft animated background glows */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{ x: [0, 20, -12, 0], y: [0, -10, 8, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl"
        animate={{ x: [0, -18, 10, 0], y: [0, 12, -8, 0] }}
        transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
      />

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="enter"
        className="mx-auto max-w-3xl px-6 pt-28"
      >
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur shadow-[0_10px_40px_rgba(0,0,0,.35)]">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${i <= step ? "bg-white/80" : "bg-white/25"}`}
                  layout
                />
              ))}
              <span className="ml-auto text-xs text-slate-400">
                Step {step + 1} / 3
              </span>
            </div>
          </div>

          {/* Steps */}
          <div className="min-h-[180px]">
            <AnimatePresence custom={dir} mode="popLayout">
              <motion.div
                key={step}
                custom={dir}
                variants={stepVariants}
                initial="initial"
                animate="center"
                exit="exit"
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* --- ADDED: Error Message Display --- */}
          {errorMessage && (
            <div className="mt-4 text-center text-sm text-red-400">
              {errorMessage}
            </div>
          )}
          {/* ------------------------------------ */}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className={`rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition
              ${step === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-white/10"}`}
            >
              Back
            </button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
              onClick={next}
              disabled={isSubmitting} // Disable button while submitting
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2 font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : (step < 2 ? "Next" : "Go to dashboard")}
              {!isSubmitting && (
                <motion.span
                  aria-hidden
                  initial={{ x: 0 }}
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="inline-block"
                >
                  →
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

