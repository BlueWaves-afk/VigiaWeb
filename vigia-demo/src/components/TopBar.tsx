"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import ThemeToggle from "@/components/ThemeToggle";

type NavLink = { href: string; label: string; description?: string };
type DropdownItem = { href: string; label: string; description: string; external?: boolean };

const LINKS: NavLink[] = [
  {
    href: "/pricing",
    label: "PRICING",
  },
  {
    href: "/docs",
    label: "DOCS",
  },
];

const SANDBOX_ITEMS: DropdownItem[] = [
  {
    href: "/sandbox/aegis",
    label: "AEGIS",
    description: "Privacy-first perception (blur faces & plates)",
  },
  {
    href: "/sandbox/v2x",
    label: "V2X DEMO",
    description: "Vehicle ↔ Vehicle alerts over WS/MQTT",
  },
  {
    href: "/sandbox/sensor",
    label: "SENSOR FUSION",
    description: "Multimodal (acoustic + accelerometer)",
  },
  {
    href: "/sandbox/dbscan",
    label: "DBSCAN CLUSTERING",
    description: "Cluster & deduplicate reports",
  },
  {
    href: "/sandbox/forecast",
    label: "PREDICTIVE FORECAST",
    description: "Hazard density projections",
  },
  {
    href: "/sandbox/copilot",
    label: "CO-PILOT (GEO-RAG)",
    description: "Generative guidance from geospatial context",
  },
  {
    href: "/sandbox/argus_web",
    label: "ARGUS WEB (ONNX)",
    description: "Browser ONNX/WebGPU speed (FPS) demo",
  },
  {
    href: "/sandbox/on_device",
    label: "ON-DEVICE FINE TUNING",
    description: "Federated hazard resolution",
  },
];

export default function TopBar() {
  const r = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const resourcesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onResourcesClick(e: MouseEvent) {
      if (!resourcesOpen) return;
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) setResourcesOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("mousedown", onResourcesClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("mousedown", onResourcesClick);
    };
  }, [open, resourcesOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setResourcesOpen(false);
      }
    };
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

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] pointer-events-auto">
      {/* Banner */}
      <Link
        href="/sandbox"
        className="group block w-full text-center text-sm text-white/90 py-2.5 border-b border-slate-800/60 bg-[#0B1120] light:bg-white light:text-slate-900 light:border-slate-200"
        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
      >
        <span className="font-medium">
          Check out our{" "}
          <span className="text-cyan-400 light:text-blue-600">Sandbox</span> to explore our features
        </span>
        <span
          aria-hidden
          className="inline-flex items-center ml-1 transition-all duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>

      {/* Main navigation bar */}
      <div className="relative w-full border-b border-slate-800/60 bg-[#0B1120] light:bg-white light:border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Primary" className="h-16 flex items-center justify-between" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
            {/* Brand */}
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold tracking-tight text-white light:text-slate-900">
                VIGIA
              </span>
            </Link>

            {/* Desktop nav + actions */}
            <div className="hidden md:flex items-center gap-6">
              {/* Resources dropdown */}
              <div className="relative" ref={resourcesRef}>
                <button
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors uppercase tracking-wide light:text-slate-600 light:hover:text-slate-900"
                  style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}
                >
                  RESOURCES
                  <svg
                    className={`w-4 h-4 transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Resources dropdown menu */}
                {resourcesOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[480px] rounded-lg border border-slate-800 bg-[#0B1120] shadow-2xl overflow-hidden light:bg-white light:border-slate-200">
                    <div className="grid grid-cols-2 divide-x divide-slate-800 light:divide-slate-200">
                      <div className="p-6 space-y-4">
                        <Link
                          href="/sandbox"
                          onClick={() => setResourcesOpen(false)}
                          className="block group"
                        >
                          <div className="text-sm font-bold text-white uppercase tracking-wide light:text-slate-900" style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>
                            SANDBOX
                          </div>
                          <div className="mt-1 text-sm text-slate-400 light:text-slate-600">
                            Try live demos and simulations
                          </div>
                        </Link>
                        {SANDBOX_ITEMS.slice(0, 4).map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setResourcesOpen(false)}
                            className="block group"
                          >
                            <div className="text-xs font-bold text-white uppercase tracking-wide group-hover:text-cyan-400 transition-colors light:text-slate-900 light:group-hover:text-blue-600" style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>
                              {item.label}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400 light:text-slate-600">
                              {item.description}
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="p-6 space-y-4">
                        {SANDBOX_ITEMS.slice(4).map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setResourcesOpen(false)}
                            className="block group"
                          >
                            <div className="text-xs font-bold text-white uppercase tracking-wide group-hover:text-cyan-400 transition-colors light:text-slate-900 light:group-hover:text-blue-600" style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}>
                              {item.label}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400 light:text-slate-600">
                              {item.description}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Regular nav links */}
              {LINKS.map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-sm font-medium uppercase tracking-wide transition-colors ${
                      active ? "text-white light:text-slate-900" : "text-slate-300 hover:text-white light:text-slate-600 light:hover:text-slate-900"
                    }`}
                    style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}
                  >
                    {label}
                  </Link>
                );
              })}

              <Link
                href="/careers"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors uppercase tracking-wide light:text-slate-600 light:hover:text-slate-900"
                style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}
              >
                CAREERS
              </Link>

              <Link
                href="/enterprise"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors uppercase tracking-wide light:text-slate-600 light:hover:text-slate-900"
                style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}
              >
                ENTERPRISE
              </Link>

              <ThemeToggle />

              <button
                onClick={handleStart}
                className="ml-auto rounded-full bg-emerald-500 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider
                         transition-all duration-200
                         hover:bg-emerald-600
                         disabled:opacity-50"
                disabled={loading}
                aria-label="Start"
                style={{ fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace' }}
              >
                {loading ? "Loading..." : "OPEN DASHBOARD"}
              </button>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                aria-label="Open menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-lg
                         px-3 py-2 
                         text-white/90 hover:bg-white/10 transition-colors"
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
              className="rounded-2xl border border-slate-800 bg-[#0B1120] p-5 shadow-2xl max-h-[calc(100vh-6rem)] overflow-y-auto"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
            >
              <div className="mb-5 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-indigo-500/10 p-4 text-white/90">
                <p className="text-sm font-semibold">Ship faster on mobile</p>
                <p className="mt-1 text-sm text-white/70">
                  Access dashboards, deploy demos, and blur data right from your phone.
                </p>
              </div>

              {/* Mobile navigation links */}
              <div className="grid gap-3">
                <Link
                  href="/sandbox"
                  onClick={() => setOpen(false)}
                  className="group block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold tracking-wide text-white/85 group-hover:text-white">
                      Sandbox
                    </span>
                    <span className="text-sm text-white/60 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">Try live demos and simulations</p>
                </Link>

                {LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="group block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-semibold tracking-wide text-white/85 group-hover:text-white">
                        {label}
                      </span>
                      <span className="text-sm text-white/60 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                ))}

                <Link
                  href="/careers"
                  onClick={() => setOpen(false)}
                  className="group block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold tracking-wide text-white/85 group-hover:text-white">
                      Careers
                    </span>
                    <span className="text-sm text-white/60 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/enterprise"
                  onClick={() => setOpen(false)}
                  className="group block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold tracking-wide text-white/85 group-hover:text-white">
                      Enterprise
                    </span>
                    <span className="text-sm text-white/60 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  href="/auth/signin"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center text-white/90 transition-colors hover:bg-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleStart();
                  }}
                  className="rounded-full bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "OPEN DASHBOARD"}
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