"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";

type NavLink = { href: string; label: string; description?: string };

const LINKS: NavLink[] = [
  {
    href: "/",
    label: "Home",
    description: "Preview the platform, stack, and latest releases",
  },
  {
    href: "/sandbox",
    label: "Sandbox",
    description: "Try live demos, models, and workflows in-browser",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Monitor deployments, moderation, and alerts",
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "Compare plans and enterprise support options",
  },
  {
    href: "/docs",
    label: "Docs",
    description: "API references, guides, and developer resources",
  },
];

export default function TopBar() {
  const r = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Updated banner background to match the sonic hero style
  const bannerBackground = "linear-gradient(180deg, #1e293b, #0f172a), radial-gradient(#ffffff12 1px, transparent 1px)";
  const bannerBgSize = "100% 100%, 3px 3px";

  const handleStart = useCallback(() => {
    if (loading) return;
    if (!profile) return r.push("/auth/signin");
    if (!profile.hasOnboarded) {
      if (pathname !== "/onboarding") r.push("/onboarding");
      return;
    }
    r.push("/dashboard");
  }, [r, pathname, profile, loading]);

  const NavLinks = ({
    className = "",
    onNavigate,
    orientation = "horizontal",
  }: {
    className?: string;
    onNavigate?: () => void;
    orientation?: "horizontal" | "vertical";
  }) => (
    <div className={className}>
      {LINKS.map(({ href, label, description }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

        if (orientation === "vertical") {
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`group block rounded-2xl border px-4 py-3 transition-all duration-200 ${
                active
                  ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_12px_40px_rgba(56,189,248,0.15)]"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-base font-semibold tracking-wide transition-colors ${
                    active ? "text-white" : "text-white/85 group-hover:text-white"
                  }`}
                >
                  {label}
                </span>
                <span
                  aria-hidden
                  className={`text-sm transition-transform duration-200 ${
                    active ? "translate-x-0 text-cyan-300" : "text-white/60 group-hover:translate-x-1"
                  }`}
                >
                  →
                </span>
              </div>
              {description && <p className="mt-1 text-sm text-white/70">{description}</p>}
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="group relative block py-2 text-base font-medium transition-all md:text-lg"
          >
            <span
              className={`transition-colors duration-300 ${
                active
                  ? "text-white drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                  : "text-slate-300 group-hover:text-white"
              }`}
            >
              {label}
            </span>
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-300 ease-out ${
                active ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </Link>
        );
      })}
    </div>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] pointer-events-auto">
      {/* Updated banner to match sonic hero style */}
      <Link
        href="/sandbox"
        className="group block w-full text-center text-sm md:text-base text-white/90 py-2.5 border-b border-slate-700/40 backdrop-blur-sm"
        style={{
          background: bannerBackground,
          backgroundSize: bannerBgSize,
          backgroundPosition: "0 0, 0 0",
        }}
      >
        <span className="font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Check out our{" "}
          <span className="underline underline-offset-2 decoration-cyan-400/60">Sandbox</span> to explore our features
        </span>
        <span
          aria-hidden
          className="inline-flex items-center ml-1 transition-all duration-300 group-hover:translate-x-1 group-hover:text-cyan-300"
        >
          →
        </span>
      </Link>

      {/* Main navigation bar - updated to match sonic hero */}
      <div className="relative w-full border-b border-white/10 bg-slate-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Primary" className="h-16 md:h-[72px] flex items-center justify-between">
            {/* Brand without logo - simplified */}
            <Link href="/" className="group flex items-center gap-2">
              <span className="relative text-2xl md:text-[28px] font-semibold tracking-wide 
                             bg-gradient-to-r from-cyan-400 via-emerald-300 to-fuchsia-400 
                             bg-clip-text text-transparent
                             drop-shadow-[0_2px_12px_rgba(56,189,248,0.3)]
                             overflow-hidden">
                VIGIA
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent 
                               translate-x-[-200%] group-hover:translate-x-[200%] 
                               transition-transform duration-1000 ease-in-out
                               [mask-image:linear-gradient(90deg,transparent,white,transparent)]" />
              </span>
            </Link>

            {/* Desktop nav + actions */}
            <div className="hidden md:flex items-center gap-6">
              <NavLinks className="flex items-center gap-8" />
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/signin"
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 
                           hover:bg-white/10 hover:border-white/25 transition-all duration-200
                           hover:-translate-y-0.5 active:translate-y-0"
                >
                  Sign in
                </Link>
                <button
                  onClick={handleStart}
                  className="rounded-xl bg-white text-slate-900 px-5 py-2 font-semibold
                           shadow-[0_4px_16px_rgba(255,255,255,0.1)]
                           transition-all duration-200
                           hover:shadow-[0_6px_22px_rgba(255,255,255,0.15)]
                           hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
                           whitespace-nowrap disabled:opacity-50"
                  disabled={loading}
                  aria-label="Start"
                >
                  {loading ? "Loading..." : "Get Started"}
                </button>
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-xl 
                         border border-white/15 bg-white/5 px-3 py-2 
                         text-white/90 hover:bg-white/10 transition-all duration-200
                         hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="sr-only">Menu</span>
                <div className="relative h-4 w-5">
                  <span className={`absolute left-0 top-0 h-0.5 w-5 bg-white rounded-full 
                                  transition-all duration-300 ${open ? "translate-y-1.5 rotate-45" : ""}`} />
                  <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-white rounded-full 
                                  transition-all duration-300 ${open ? "opacity-0 scale-0" : "opacity-100 scale-100"}`} />
                  <span className={`absolute left-0 top-3 h-0.5 w-5 bg-white rounded-full 
                                  transition-all duration-300 ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
                </div>
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile backdrop */}
        {open && (
          <div
            className="md:hidden fixed inset-0 z-[9980] bg-slate-950/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <div
          className={`md:hidden absolute left-0 right-0 top-full z-[10000] origin-top transform transition-all duration-300 ease-out ${
            open ? "pointer-events-auto translate-y-2 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <div className="px-4 pb-5">
            <div
              ref={panelRef}
              className="rounded-2xl border border-white/15 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl max-h-[calc(100vh-6rem)] overflow-y-auto"
            >
              <div className="mb-5 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-indigo-500/10 p-4 text-white/90">
                <p className="text-sm font-semibold">Ship faster on mobile</p>
                <p className="mt-1 text-sm text-white/70">
                  Access dashboards, deploy demos, and blur data right from your phone.
                </p>
              </div>
              <NavLinks
                className="grid gap-3"
                orientation="vertical"
                onNavigate={() => setOpen(false)}
              />
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  href="/auth/signin"
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleStart();
                  }}
                  className="rounded-xl bg-white px-4 py-3 text-center font-semibold text-slate-900 shadow-[0_8px_24px_rgba(255,255,255,0.18)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Get Started"}
                </button>
              </div>
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                <p className="font-medium text-white/80">Need enterprise access?</p>
                <p className="mt-1">
                  Email <a className="underline underline-offset-2" href="mailto:team@vigia.ai">team@vigia.ai</a> for rollout support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}