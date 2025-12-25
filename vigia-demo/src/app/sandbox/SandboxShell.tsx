"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  RadioTower,
  Waves,
  Network,
  LineChart,
  BotMessageSquare,
  Gauge,
  Cpu,
} from "lucide-react";
import type { JSX } from "react/jsx-runtime";

// Lazy-load demo panels (no SSR)
const V2XDemo = dynamic(() => import("@/components/V2XDemo"), { ssr: false });
const SensorFusion = dynamic(() => import("@/components/sensor-fusion"), { ssr: false });
const DBSCANDemo = dynamic(() => import("@/components/DBSCANDemo"), { ssr: false });
const ForecastDemo = dynamic(() => import("@/components/ForecastDemo"), { ssr: false });
const ArgusAegisDemo = dynamic(() => import("@/components/AegisDemo"), { ssr: false });
const ArgusBrowserDemo = dynamic(() => import("@/components/ArgusBrowserDemo"), { ssr: false });
const CopilotGeoRAG = dynamic(() => import("@/components/CopilotGeoRAG"), { ssr: false });
const OnDeviceFineTuning = dynamic(() => import("@/components/OnDeviceFineTuning"), { ssr: false });

type TabKey =
  | "aegis"
  | "v2x"
  | "sensor"
  | "dbscan"
  | "forecast"
  | "copilot"
  | "argus_web"
  | "on_device";

const NAV: { key: TabKey; label: string; desc: string }[] = [
  {
    key: "aegis",
    label: "Aegis",
    desc: "Privacy‑first perception (blur faces & plates)",
  },
  {
    key: "argus_web",
    label: "Argus Web (ONNX)",
    desc: "Browser ONNX/WebGPU speed (FPS) demo",
  },
  {
    key: "v2x",
    label: "V2X Demo",
    desc: "Vehicle‑to‑vehicle hazard alerts",
  },
  {
    key: "sensor",
    label: "Sensor Perception",
    desc: "Multimodal acoustic + accelerometer",
  },
  {
    key: "dbscan",
    label: "DBSCAN Clustering",
    desc: "Cluster & deduplicate hazard reports",
  },
  {
    key: "forecast",
    label: "Predictive Forecast",
    desc: "Hazard density projections",
  },
  {
    key: "copilot",
    label: "Co‑Pilot (Geo‑RAG)",
    desc: "Generative guidance from geospatial memory",
  },
  {
    key: "on_device",
    label: "On‑Device Fine‑Tuning",
    desc: "Federated hazard resolution",
  },
];

const ICONS: Record<TabKey, JSX.Element> = {
  aegis: <Shield size={18} />,
  argus_web: <Gauge size={18} />,
  v2x: <RadioTower size={18} />,
  sensor: <Waves size={18} />,
  dbscan: <Network size={18} />,
  forecast: <LineChart size={18} />,
  copilot: <BotMessageSquare size={18} />,
  on_device: <Cpu size={18} />,
};

export default function SandboxShell({ initialTab }: { initialTab?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const v = typeof window !== "undefined"
      ? window.localStorage.getItem("sandbox.sidebar.collapsed")
      : null;
    if (v === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "sandbox.sidebar.collapsed",
      collapsed ? "1" : "0",
    );
  }, [collapsed]);

  const gridCols = useMemo(
    () => ({ ["--sidebar" as any]: collapsed ? "72px" : "224px" }),
    [collapsed],
  );

  const activeKey = (pathname ? pathname.split("/").pop() : initialTab) as
    | TabKey
    | undefined;

  const active: TabKey =
    (NAV.find((n) => n.key === activeKey)?.key ??
      (initialTab as TabKey) ??
      "v2x") as TabKey;

  const activeMeta = NAV.find((n) => n.key === active);

  const SideNav = (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 224 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className={[
        "sticky top-24 self-start",
        "rounded-2xl border border-slate-800/60",
        "bg-slate-950/80 backdrop-blur-xl",
        "shadow-[0_18px_45px_rgba(15,23,42,0.8)]",
        collapsed ? "p-2" : "p-3",
        "max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar",
      ].join(" ")}
      style={{ willChange: "width" }}
    >
      <div
        className={`mb-3 flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <motion.div
            key="title"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 0.8, x: 0 }}
            className="px-1 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400"
          >
            SANDBOX
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed((s) => !s)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-100 hover:bg-white/10"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={`/sandbox/${item.key}`}
              onClick={() => setMobileOpen(false)}
              className={[
                "group relative w-full rounded-xl outline-none",
                "transition-colors focus:ring-2 focus:ring-cyan-500/40",
                collapsed ? "px-2 py-3" : "px-2 py-2.5",
                "grid items-center gap-3",
                collapsed
                  ? "grid-cols-[28px] justify-items-center"
                  : "grid-cols-[28px_minmax(0,1fr)]",
                isActive
                  ? "bg-white text-slate-900"
                  : "text-slate-100/80 hover:bg-white/10",
                "border border-transparent",
              ].join(" ")}
              title={
                collapsed ? `${item.label} — ${item.desc}` : undefined
              }
            >
              <div
                className={[
                  "grid h-7 w-7 place-items-center rounded-md",
                  isActive
                    ? "bg-slate-900 text-slate-100"
                    : "bg-white/10 text-white/90",
                ].join(" ")}
              >
                {ICONS[item.key]}
              </div>

              {!collapsed && (
                <motion.div
                  key="labels"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className="min-w-0 text-left leading-snug"
                >
                  <div
                    className={`truncate text-sm font-semibold ${
                      isActive ? "text-slate-900" : "text-slate-50"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`truncate text-xs ${
                      isActive
                        ? "text-slate-600"
                        : "text-slate-300/80"
                    }`}
                  >
                    {item.desc}
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );

  return (
    <PageShell
      title="Sandbox"
      subtitle="Try live edge‑AI demos in your browser: perception, V2X, clustering, forecasting, and more—backed by the same primitives as production VIGIA."
    >
      {/* Mobile controls */}
      <div className="mb-4 flex items-center gap-2 md:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-full border border-slate-800/70 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-900 light:border-slate-200 light:bg-white light:text-slate-900"
        >
          {mobileOpen ? "Close menu" : "Open menu"}
        </button>
        <button
          onClick={() => setCollapsed((s) => !s)}
          className="rounded-full border border-slate-800/70 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-900 light:border-slate-200 light:bg-white light:text-slate-900"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      <div
        className="grid items-start gap-6 md:grid-cols-[var(--sidebar)_minmax(0,1fr)]"
        style={gridCols}
      >
        {/* Desktop sidebar */}
        <div className="hidden md:block">{SideNav}</div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="fixed inset-0 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                className="absolute left-0 top-0 h-full w-[224px] p-3"
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 28,
                }}
              >
                {SideNav}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active demo panel */}
        <section className="min-w-0 space-y-6">
          {activeMeta && (
            <div className="mb-2">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-400 light:text-blue-600">
                ACTIVE DEMO
              </p>
              <h2 className="text-sm font-semibold text-slate-50 light:text-slate-900">
                {activeMeta.label}
              </h2>
              <p className="mt-1 text-xs text-slate-400 light:text-slate-600">
                {activeMeta.desc}
              </p>
            </div>
          )}

          {active === "aegis" && <ArgusAegisDemo />}
          {active === "argus_web" && <ArgusBrowserDemo />}
          {active === "v2x" && <V2XDemo />}
          {active === "sensor" && <SensorFusion />}
          {active === "dbscan" && <DBSCANDemo />}
          {active === "copilot" && <CopilotGeoRAG />}
          {active === "forecast" && <ForecastDemo />}
          {active === "on_device" && <OnDeviceFineTuning />}
        </section>
      </div>
    </PageShell>
  );
}
