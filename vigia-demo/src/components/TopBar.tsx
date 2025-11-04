"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import Logo from "@/components/Logo";

type NavLink = { href: string; label: string };

const LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/copilot", label: "Copilot" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export default function TopBar() {
  const r = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleStart = useCallback(() => {
    if (loading) return;
    if (!profile) return r.push("/auth/signin");
    if (!profile.hasOnboarded) {
      if (pathname !== "/onboarding") r.push("/onboarding");
      return;
    }
    r.push("/dashboard");
  }, [r, pathname, profile, loading]);

  const NavLinks = ({ className = "" }: { className?: string }) => (
    <div className={className}>
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`block text-base md:text-lg transition-colors ${
              active ? "text-white" : "text-slate-200/90 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-[100]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Primary"
          className="
            h-20 md:h-24
            rounded-b-2xl
            border-b border-white/10
            bg-slate-950/70 backdrop-blur
            supports-[backdrop-filter]:bg-slate-950/50
            shadow-[0_8px_30px_rgba(0,0,0,.25)]
            flex items-center justify-between
            px-3 md:px-5
          "
        >
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-900/40 ring-1 ring-cyan-500/30">
              {/* use the reusable logo */}
              <Logo size={18} />
            </div>
            <span className="text-white text-2xl md:text-3xl font-semibold tracking-wide">
              VIGIA
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavLinks className="flex items-center gap-8" />
            <button
              onClick={handleStart}
              className="rounded-xl bg-white text-slate-900 px-4 py-2 text-base font-medium hover:bg-slate-100 disabled:opacity-50"
              aria-label="Start"
              disabled={loading}
            >
              {loading ? "Loading..." : "Start"}
            </button>
          </div>

          {/* Mobile: hamburger */}
          <div className="md:hidden">
            <button
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/90 hover:bg-white/10"
            >
              {/* simple hamburger / close icon via CSS */}
              <span className="sr-only">Menu</span>
              <div className="relative h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-0.5 w-5 bg-white transition-transform ${
                    open ? "translate-y-1.5 rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-0.5 w-5 bg-white transition-opacity ${
                    open ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 top-3 h-0.5 w-5 bg-white transition-transform ${
                    open ? "-translate-y-1.5 -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile panel */}
      <div
        className={`md:hidden transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div
          ref={panelRef}
          className="mx-4 mt-2 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur p-4 shadow-xl"
        >
          <NavLinks className="space-y-3" />
          <button
            onClick={handleStart}
            className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-slate-900 font-medium hover:bg-slate-100 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Loading..." : profile ? "Open Console" : "Sign in"}
          </button>
        </div>
      </div>

      {/* glow line */}
      <div className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]" />
    </header>
  );
}