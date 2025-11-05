"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import PageShell from "@/components/PageShell";

// —— Lazy-load demo panels (no SSR) ——
const V2XDemo = dynamic(() => import("../../components/V2XDemo"), { ssr: false });
const SensorFusion = dynamic(() => import("../../components/sensor-fusion"), { ssr: false });
const DBSCANDemo = dynamic(() => import("../../components/DBSCANDemo"), { ssr: false });
const ForecastDemo = dynamic(() => import("../../components/ForecastDemo"), { ssr: false });
const ArgusAegisDemo = dynamic(
  () => import("../../components/ArgusAegisDemo"),
  { ssr: false }
);
const CopilotGeoRAG = dynamic(() => import("../../components/CopilotGeoRAG"), { ssr: false });
// add "argus" to the union
type TabKey = "argus"|"v2x" | "sensor" | "dbscan" | "forecast" | "copilot";

const NAV: { key: TabKey; label: string; desc: string }[] = [
  { key: "argus",    label: "Argus + Aegis",      desc: "Privacy-first perception (blur faces & plates)" },
  { key: "v2x",      label: "V2X Demo",           desc: "Vehicle ↔ Vehicle alerts over WS/MQTT" },
  { key: "sensor",   label: "Sensor Perception",  desc: "Multimodal (acoustic + accelerometer)" },
  { key: "dbscan",   label: "DBSCAN Clustering",  desc: "Cluster & deduplicate reports" },
  { key: "forecast", label: "Predictive Forecast",desc: "Hazard density projections" },
  { key: "copilot",  label: "Co-Pilot (Geo-RAG)",  desc: "Generative guidance from geospatial context" },
];

export default function SandboxPage() {
  const [tab, setTab] = useState<TabKey>("v2x");

  return (
    <PageShell
      title="Sandbox"
      subtitle="Interactive demos: V2X, multimodal sensor fusion, clustering, network intelligence, and forecasting."
    >
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Local sidebar */}
        <aside className="card-glass p-3 md:p-4 h-max">
          <div className="mb-2 px-2 text-xs uppercase tracking-wider text-white/50">
            Demos
          </div>
          <nav className="flex flex-col">
            {NAV.map((item) => {
              const active = tab === item.key;
              const baseBtn = "text-left rounded-lg px-3 py-2 transition";
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={
                    active
                      ? `${baseBtn} bg-white text-slate-900`
                      : `${baseBtn} text-white/80 hover:bg-white/10`
                  }
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className={`text-xs ${active ? "text-slate-600" : "text-white/50"}`}>
                    {item.desc}
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Demo surface */}
        <section className="space-y-6">
          {tab === "argus" && <ArgusAegisDemo />}
          {tab === "v2x" && <V2XDemo />}
          {tab === "sensor" && <SensorFusion />}
          {tab === "dbscan" && <DBSCANDemo />}
          {tab === "copilot" && <CopilotGeoRAG />}
          {tab === "forecast" && <ForecastDemo />}
          
          
        </section>
      </div>
    </PageShell>
  );
}