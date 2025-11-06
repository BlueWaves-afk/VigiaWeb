"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";

type NavLink = { href: string; label: string };

const LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/sandbox", label: "Sandbox" },
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

  const NavLinks = ({ className = "" }: { className?: string }) => (
    <div className={className}>
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="group relative block text-base md:text-lg font-medium transition-all py-2"
          >
            <span className={`transition-colors duration-300 ${
              active 
                ? "text-white drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]" 
                : "text-slate-300 group-hover:text-white"
            }`}>
              {label}
            </span>
            <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-300 ease-out ${
              active ? "w-full" : "w-0 group-hover:w-full"
            }`} />
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
      <div className="w-full border-b border-white/10 bg-slate-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/80">
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

        {/* Mobile drawer */}
        <div
          className={`md:hidden transition-all duration-300 ease-out ${
            open ? "max-h-96 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2"
          } overflow-hidden`}
        >
          <div
            ref={panelRef}
            className="mx-4 mt-3 mb-3 rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl p-5 shadow-xl"
          >
            <NavLinks className="flex flex-col gap-3" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/auth/signin"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/90 
                         hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  handleStart();
                }}
                className="rounded-xl bg-white px-4 py-3 text-center font-semibold text-slate-900
                         shadow-[0_4px_16px_rgba(255,255,255,0.1)]
                         transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0
                         disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Loading..." : "Get Started"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}