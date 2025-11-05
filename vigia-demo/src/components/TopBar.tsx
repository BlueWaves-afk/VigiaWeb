// TopBar.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";

type NavLink = { href: string; label: string };

// Optional custom dither/noise image for the banner.
// Put the file in /public/… and set the path here (leave "" to use CSS dots).
const CUSTOM_DITHER_IMAGE_URL = "/textures/dither.png";

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
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
            className="px-2 py-3 text-base md:text-lg font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            <span className={active ? "text-white" : undefined}>{label}</span>
          </Link>
        );
      })}
    </div>
  );

  // Compose banner background (green base + custom image or tiny dots)
  const bannerBackground = (() => {
    const green = "linear-gradient(180deg,#1ea763,#15803d)";
    const dots = "radial-gradient(#ffffff18 1px, transparent 1px)";
    const custom = CUSTOM_DITHER_IMAGE_URL ? `url(${CUSTOM_DITHER_IMAGE_URL})` : "";
    return custom ? `${green}, ${custom}` : `${green}, ${dots}`;
  })();

  const bannerBgSize =
    CUSTOM_DITHER_IMAGE_URL && CUSTOM_DITHER_IMAGE_URL.length > 0
      ? "100% 100%, cover"
      : "100% 100%, 3px 3px";

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] pointer-events-auto">
      {/* Dither banner with animated arrow */}
      <Link
        href="/sandbox"
        className="group block w-full text-center text-sm md:text-base text-white/95 py-2 border-b border-emerald-700/40"
        style={{
          background: bannerBackground,
          backgroundSize: bannerBgSize,
          backgroundPosition: "0 0, 0 0",
        }}
      >
        <span className="font-medium">
          Check out our{" "}
          <span className="underline underline-offset-2 decoration-white/60">Sandbox</span> to learn
          about our features
        </span>
        <span
          aria-hidden
          className="inline-flex items-center ml-1 transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>

      {/* Main nav */}
      <div className="w-full border-b border-white/10 bg-[#0f1113]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f1113]/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Primary" className="h-16 md:h-[72px] flex items-center justify-between">
            {/* Brand (no logo, simple wordmark) */}
            <Link href="/" className="flex items-center">
              <span className="text-white text-2xl md:text-[28px] font-semibold tracking-wide">
                VIGIA
              </span>
            </Link>

            {/* Desktop nav + actions */}
            <div className="hidden md:flex items-center gap-6">
              <NavLinks className="flex items-center gap-6" />
              <Link
                href="/auth/signin"
                className="rounded-full border border-white/15 px-4 md:px-5 py-2 text-base text-white/90 hover:bg-white/5 transition-all"
              >
                Sign in
              </Link>
              <button
                onClick={handleStart}
                className="rounded-full bg-white text-[#0f1113] px-4 md:px-5 py-2 text-base font-semibold
                           shadow-[0_4px_16px_rgba(255,255,255,0.05)]
                           transition-all duration-200
                           hover:shadow-[0_6px_22px_rgba(255,255,255,0.08)]
                           hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
                           whitespace-nowrap"
                disabled={loading}
                aria-label="Start"
              >
                {loading ? "Loading…" : "Start"}
              </button>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-xl 
                           border border-white/15 bg-white/5 px-3 py-2 
                           text-white/90 hover:bg-white/10 transition-all"
              >
                <span className="sr-only">Menu</span>
                <div className="relative h-4 w-5">
                  <span className={`absolute left-0 top-0 h-0.5 w-5 bg-white rounded-full transition-all ${open ? "translate-y-1.5 rotate-45" : ""}`} />
                  <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-white rounded-full transition-opacity ${open ? "opacity-0" : "opacity-100"}`} />
                  <span className={`absolute left-0 top-3 h-0.5 w-5 bg-white rounded-full transition-all ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
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
            className="mx-4 mt-3 rounded-2xl border border-white/15 bg-[#0f1113]/95 backdrop-blur p-5"
          >
            <NavLinks className="flex flex-col gap-2" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/auth/signin"
                className="rounded-xl border border-white/15 px-4 py-2 text-center text-white/90 hover:bg-white/5 transition-all"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  handleStart();
                }}
                className="rounded-xl bg-white px-4 py-2 text-center font-semibold text-[#0f1113]
                           shadow-[0_4px_16px_rgba(255,255,255,0.05)]
                           transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                disabled={loading}
              >
                {loading ? "Loading…" : "Start"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}