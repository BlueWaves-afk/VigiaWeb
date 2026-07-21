"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import ThemeToggle from "@/components/ThemeToggle";

type NavLink = { href: string; label: string };
type DropdownItem = { href: string; label: string; description: string };

const LINKS: NavLink[] = [
  { href: "/download", label: "Download" }, // ✅ ADDED
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

const SANDBOX_ITEMS: DropdownItem[] = [
  { href: "/sandbox/aegis", label: "Aegis", description: "Privacy-first perception" },
  { href: "/sandbox/v2x", label: "V2X Demo", description: "Vehicle-to-vehicle alerts" },
  { href: "/sandbox/sensor", label: "Sensor Fusion", description: "Multimodal perception" },
  { href: "/sandbox/dbscan", label: "DBSCAN", description: "Cluster & deduplicate" },
  { href: "/sandbox/forecast", label: "Forecast", description: "Hazard projections" },
  { href: "/sandbox/copilot", label: "Co-Pilot", description: "Generative guidance" },
  { href: "/sandbox/argus_web", label: "Argus Web", description: "Browser ONNX demo" },
  { href: "/sandbox/on_device", label: "Fine Tuning", description: "Federated learning" },
];

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const mobileRef = useRef<HTMLDivElement | null>(null);
  const resourcesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setResourcesOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileOpen && mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
      if (resourcesOpen && resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen, resourcesOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setResourcesOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleStart = useCallback(() => {
    if (loading) return;
    if (!profile) return router.push("/auth/signin");
    if (!profile.hasOnboarded) {
      if (pathname !== "/onboarding") router.push("/onboarding");
      return;
    }
    router.push("/dashboard");
  }, [router, pathname, profile, loading]);

  return (
    <header className="fixed inset-x-0 top-0 z-[9999]">
      {/* Top Banner */}
      <Link
        href="/sandbox"
        className="group block w-full bg-black/90 backdrop-blur-sm border-b border-slate-800 py-2.5 text-center text-sm text-slate-300 hover:text-white"
      >
        Try our <span className="font-semibold text-cyan-400">Sandbox</span>
        <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">→</span>
      </Link>

      {/* Main Nav */}
      <div className="bg-black/95 backdrop-blur-md border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-xl font-semibold tracking-tight text-white">
              VIGIA
            </Link>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-8">
              {/* Resources */}
              <div className="relative" ref={resourcesRef}>
                <button
                  onClick={() => setResourcesOpen(v => !v)}
                  className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white"
                >
                  Resources
                  <svg
                    className={`h-4 w-4 transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {resourcesOpen && (
                  <div className="absolute right-0 top-full mt-3 w-[520px] rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
                    <div className="p-2">
                      <Link href="/sandbox" className="block rounded-lg px-4 py-3 hover:bg-slate-900">
                        <div className="font-semibold text-white">Sandbox</div>
                        <div className="text-sm text-slate-400">Try live demos and simulations</div>
                      </Link>

                      <div className="my-2 h-px bg-slate-800" />

                      <div className="grid grid-cols-2 gap-1">
                        {SANDBOX_ITEMS.map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-lg px-4 py-2.5 hover:bg-slate-900"
                          >
                            <div className="text-sm font-medium text-white">{item.label}</div>
                            <div className="text-xs text-slate-500">{item.description}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Links */}
              {LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium ${
                    pathname.startsWith(href)
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              ))}

              <ThemeToggle />

              <button
                onClick={handleStart}
                disabled={loading}
                className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Dashboard"}
              </button>
            </div>

            {/* Mobile */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              ref={mobileRef}
              className="absolute left-4 right-4 top-full mt-2 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl"
            >
              {[...LINKS].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-900 hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
