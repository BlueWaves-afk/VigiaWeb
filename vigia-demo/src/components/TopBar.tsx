"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/auth"; // must export getSession() & Session type

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

  // read session once on mount (kept local; we don't need to re-render on change)
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      setHasSession(false);
      setHasOnboarded(false);
    } else {
      setHasSession(true);
      setHasOnboarded(!!s.hasOnboarded);
    }
  }, []);

  const handleStart = useCallback(() => {
    const s = getSession(); // re-check at click time
    if (!s) {
      r.push("/auth/signin");
      return;
    }
    if (!s.hasOnboarded) {
      if (pathname !== "/onboarding") r.push("/onboarding");
      return;
    }
    r.push("/dashboard");
  }, [r, pathname]);

  return (
    <header className="fixed top-0 inset-x-0 z-[100]">
      {/* container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Primary"
          className="
            h-20 md:h-24                           /* bigger bar */
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
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-900/40 ring-1 ring-cyan-500/30">
              <span className="text-cyan-300 text-lg font-semibold">V</span>
            </div>
            <span className="text-white text-2xl md:text-3xl font-semibold tracking-wide">
              VIGIA
            </span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {LINKS.map(({ href, label }) => {
              const active =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-base md:text-lg transition-colors ${
                    active ? "text-white" : "text-slate-200/90 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            {/* Smart Start button */}
            <button
              onClick={handleStart}
              className="rounded-xl bg-white text-slate-900 px-4 py-2 text-base font-medium hover:bg-slate-100"
              aria-label="Start"
            >
              Start
            </button>
          </div>

          {/* Mobile placeholder (add a menu later if you like) */}
          <div className="md:hidden" />
        </nav>
      </div>

      {/* thin glow line under the bar */}
      <div className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]" />
    </header>
  );
}