"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  RadioTower,
  Waves,
  Network,
  LineChart,
  BotMessageSquare,
} from "lucide-react";
import type { JSX } from "react/jsx-runtime";

const V2XDemo        = dynamic(() => import("../../components/V2XDemo"), { ssr: false });
const SensorFusion   = dynamic(() => import("../../components/sensor-fusion"), { ssr: false });
const DBSCANDemo     = dynamic(() => import("../../components/DBSCANDemo"), { ssr: false });
const ForecastDemo   = dynamic(() => import("../../components/ForecastDemo"), { ssr: false });
const ArgusAegisDemo = dynamic(() => import("../../components/ArgusAegisDemo"), { ssr: false });
const CopilotGeoRAG  = dynamic(() => import("../../components/CopilotGeoRAG"), { ssr: false });

type TabKey = "argus" | "v2x" | "sensor" | "dbscan" | "forecast" | "copilot";

const NAV: { key: TabKey; label: string; desc: string }[] = [
  { key: "argus",    label: "Argus + Aegis",       desc: "Privacy-first perception (blur faces & plates)" },
  { key: "v2x",      label: "V2X Demo",            desc: "Vehicle ↔ Vehicle alerts over WS/MQTT" },
  { key: "sensor",   label: "Sensor Perception",   desc: "Multimodal (acoustic + accelerometer)" },
  { key: "dbscan",   label: "DBSCAN Clustering",   desc: "Cluster & deduplicate reports" },
  { key: "forecast", label: "Predictive Forecast", desc: "Hazard density projections" },
  { key: "copilot",  label: "Co-Pilot (Geo-RAG)",  desc: "Generative guidance from geospatial context" },
];

const ICONS: Record<TabKey, JSX.Element> = {
  argus:    <Shield size={18} />,
  v2x:      <RadioTower size={18} />,
  sensor:   <Waves size={18} />,
  dbscan:   <Network size={18} />,
  forecast: <LineChart size={18} />,
  copilot:  <BotMessageSquare size={18} />,
};

export default function SandboxPage() {
  const [tab, setTab] = useState<TabKey>("v2x");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    const v = localStorage.getItem("sandbox.sidebar.collapsed");
    if (v === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("sandbox.sidebar.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // keep grid + sidebar exactly in sync (72 / 224)
  const gridCols = useMemo(
    () => ({ ["--sidebar" as any]: collapsed ? "72px" : "224px" }),
    [collapsed]
  );

  const SideNav = (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 224 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={[
        "sticky top-24 self-start",                 // align neatly under topbar
        "rounded-2xl border border-white/10",
        "bg-slate-900/80 backdrop-blur-xl",
        "shadow-[0_8px_24px_rgba(0,0,0,.22)]",
        collapsed ? "p-2" : "p-3",
        // scrollable if needed, but hide scrollbars:
        "max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar",
      ].join(" ")}
      style={{ willChange: "width" }}
    >
      {/* Header row */}
      <div className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <motion.div
            key="title"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 0.8, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="px-1 text-xs uppercase tracking-wider text-white/50"
          >
            Demos
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed((s) => !s)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setTab(item.key);
                setMobileOpen(false);
              }}
              className={[
                "group relative w-full rounded-xl outline-none",
                "transition-colors focus:ring-2 focus:ring-white/20",
                collapsed ? "px-2 py-3" : "px-2 py-2.5",
                "grid items-center gap-3",
                collapsed ? "grid-cols-[28px] justify-items-center" : "grid-cols-[28px_minmax(0,1fr)]",
                active ? "bg-white text-slate-900" : "text-white/80 hover:bg-white/10",
                "border border-transparent",
              ].join(" ")}
              title={collapsed ? `${item.label} — ${item.desc}` : undefined}
            >
              <div
                className={[
                  "h-7 w-7 grid place-items-center rounded-md",
                  active ? "bg-slate-900 text-slate-100" : "bg-white/10 text-white/90",
                ].join(" ")}
              >
                {ICONS[item.key]}
              </div>

              {!collapsed && (
                <motion.div
                  key="labels"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="min-w-0 text-left leading-snug"
                >
                  <div className={`truncate text-sm font-semibold ${active ? "text-slate-900" : "text-white/90"}`}>
                    {item.label}
                  </div>
                  <div className={`${active ? "text-slate-600" : "text-white/55"} truncate text-xs`}>
                    {item.desc}
                  </div>
                </motion.div>
              )}
            </button>
          );
        })}
      </nav>
    </motion.aside>
  );

  return (
    <PageShell
      title="Sandbox"
      subtitle="Interactive demos: V2X, multimodal sensor fusion, clustering, network intelligence, and forecasting."
    
    >
      {/* Mobile controls */}
      <div className="mb-3 flex items-center gap-2 md:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          {mobileOpen ? "Close menu" : "Open menu"}
        </button>
        <button
          onClick={() => setCollapsed((s) => !s)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {/* Grid: left fixed column + right fluid; align tops; prevent overflow */}
      <div
        className="grid items-start gap-6 md:grid-cols-[var(--sidebar)_minmax(0,1fr)]"
        style={gridCols}
      >
        {/* Sidebar (desktop) */}
        <div className="hidden md:block">{SideNav}</div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
              <motion.div
                className="absolute left-0 top-0 h-full w-[224px] p-3"
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              >
                {SideNav}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo surface */}
        <section className="min-w-0 space-y-6 [&>*]:w-full">
          {tab === "argus"    && <ArgusAegisDemo />}
          {tab === "v2x"      && <V2XDemo />}
          {tab === "sensor"   && <SensorFusion />}
          {tab === "dbscan"   && <DBSCANDemo />}
          {tab === "copilot"  && <CopilotGeoRAG />}
          {tab === "forecast" && <ForecastDemo />}
        </section>
      </div>

      {/* Hide scrollbars (but keep native scrolling) */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none; /* IE/Edge */
          scrollbar-width: none;    /* Firefox */
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;            /* Chrome/Safari */
        }
      `}</style>
    </PageShell>
  );
}