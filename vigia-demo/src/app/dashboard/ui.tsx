"use client";

import { useState } from "react";
import { AlertTriangle, MapPin, Clock } from "lucide-react";

type Severity = "high" | "medium" | "low";

type Hazard = {
  id: string;
  type: string;
  severity: Severity;
  confidence: number;
  detectedAt: string;
  source: string;
};

const MOCK_HAZARDS: Hazard[] = [
  {
    id: "hz-1",
    type: "Pothole",
    severity: "high",
    confidence: 0.91,
    detectedAt: "2 minutes ago",
    source: "Edge Node",
  },
  {
    id: "hz-2",
    type: "Road Crack",
    severity: "medium",
    confidence: 0.82,
    detectedAt: "8 minutes ago",
    source: "Mobile App",
  },
];

const severityAccent: Record<Severity, string> = {
  high: "text-amber-400",
  medium: "text-cyan-400",
  low: "text-emerald-400",
};

export default function DashboardClient({
  demo = true,
}: {
  demo?: boolean;
}) {
  const [active, setActive] = useState<Hazard | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {demo && (
        <div className="border-b border-cyan-500/30 bg-cyan-500/10 px-6 py-2 text-sm text-cyan-300">
          Demo environment — representative road intelligence data
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Road Hazard Dashboard</h1>
          <p className="mt-1 text-slate-400">
            Live, confidence-scored infrastructure intelligence
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr_360px]">
          {/* Context Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="space-y-6">
              <Stat label="Active Hazards" value="128" />
              <Stat label="High Severity" value="34" accent="text-amber-400" />
              <Stat label="Coverage" value="Bengaluru Urban" />
              <Stat label="Last Update" value="~2 min ago" />
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="absolute inset-0 flex items-center justify-center text-slate-600">
              Map view (Mapbox / Leaflet)
            </div>

            <button
              onClick={() => setActive(MOCK_HAZARDS[0])}
              className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20"
            />
          </div>

          {/* Detail Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            {active ? (
              <>
                <h2 className="mb-6 text-lg font-semibold">
                  Hazard Details
                </h2>

                <Detail label="Type" icon={<AlertTriangle className="h-4 w-4" />}>
                  {active.type}
                </Detail>

                <Detail label="Severity" icon={<MapPin className="h-4 w-4" />}>
                  <span className={severityAccent[active.severity]}>
                    {active.severity}
                  </span>
                </Detail>

                <Detail label="Detected" icon={<Clock className="h-4 w-4" />}>
                  {active.detectedAt}
                </Detail>

                <Detail label="Confidence">
                  {(active.confidence * 100).toFixed(0)}%
                </Detail>

                <Detail label="Source">{active.source}</Detail>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                Select a hazard on the map to inspect details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`text-2xl font-semibold ${accent ?? ""}`}>
        {value}
      </div>
    </div>
  );
}

function Detail({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex gap-3 text-sm">
      {icon && <div className="mt-0.5 text-slate-400">{icon}</div>}
      <div>
        <div className="text-slate-400">{label}</div>
        <div className="text-white">{children}</div>
      </div>
    </div>
  );
}
