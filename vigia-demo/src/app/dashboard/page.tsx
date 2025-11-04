// src/app/dashboard/page.tsx
import PageShell from "@/components/PageShell";
import {
  Activity,
  AlertTriangle,
  Clock4,
  Coins,
  Filter,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export const metadata = { title: "Dashboard • VIGIA" };

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-xs font-medium ring-1 transition",
        active
          ? "bg-white text-slate-900 ring-white"
          : "bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  foot,
  icon,
  tint = "emerald",
}: {
  label: string;
  value: string;
  foot?: string;
  icon: React.ReactNode;
  tint?: "emerald" | "sky" | "violet" | "amber";
}) {
  const tintMap: Record<string, string> = {
    emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-300",
    sky: "from-sky-500/15 to-sky-500/0 text-sky-300",
    violet: "from-violet-500/15 to-violet-500/0 text-violet-300",
    amber: "from-amber-500/15 to-amber-500/0 text-amber-300",
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tintMap[tint]}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-white/70 text-xs">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          {foot && <div className="mt-1 text-xs text-white/50">{foot}</div>}
        </div>
        <div className="shrink-0 rounded-lg bg-white/10 p-2 ring-1 ring-white/15">{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Live safety signals, model health and marketplace activity."
    >
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Chip active>Last 24h</Chip>
          <Chip>7 days</Chip>
          <Chip>30 days</Chip>
          <span className="mx-2 h-4 w-px bg-white/10" />
          <Chip>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Global
            </span>
          </Chip>
        </div>
        <div className="flex items-center gap-2">
          <Chip>
            <span className="inline-flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </span>
          </Chip>
          <button className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/15 hover:bg-white/15">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI band */}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Active devices"
          value="1,284"
          foot="+3.1% vs last week"
          icon={<Activity className="h-5 w-5" />}
          tint="emerald"
        />
        <Stat
          label="Hazards today"
          value="8,417"
          foot="↗︎ 12% since 9 AM"
          icon={<AlertTriangle className="h-5 w-5" />}
          tint="amber"
        />
        <Stat
          label="Avg TTS latency"
          value="118 ms"
          foot="p95 162 ms"
          icon={<Clock4 className="h-5 w-5" />}
          tint="sky"
        />
        <Stat
          label="Tokens earned"
          value="34,510 VGT"
          foot="24h accrual"
          icon={<Coins className="h-5 w-5" />}
          tint="violet"
        />
      </div>

      {/* Two-up charts/cards */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_80%_0%,rgba(255,255,255,0.10),transparent_55%)]" />
          <div className="mb-3 text-white/80 text-sm">Hazard density (last 24h)</div>
          <div className="h-64 rounded-lg border border-white/10 bg-black/20" />
          <div className="mt-2 text-xs text-white/50">Map overlay placeholder</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_0%_0%,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="mb-3 text-white/80 text-sm">Model health</div>
          <ul className="space-y-2 text-sm text-white/85">
            <li className="flex items-center justify-between">
              <span>argus_v8x.onnx (edge)</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                healthy
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>quant config</span>
              <span className="text-white/70">INT8, pass</span>
            </li>
            <li className="flex items-center justify-between">
              <span>false positives (p95)</span>
              <span className="text-white/70">1.8%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>export pipeline</span>
              <span className="text-white/70">last run 2h ago</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Table card */}
      <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="mb-3 text-white/80 text-sm">Recent events</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th>Time</th>
                <th>Type</th>
                <th>City</th>
                <th>Severity</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-t border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="px-3 py-2">
                    14:{(30 + i).toString().padStart(2, "0")}
                  </td>
                  <td className="px-3 py-2">pothole</td>
                  <td className="px-3 py-2">Bengaluru</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300 ring-1 ring-amber-500/30">
                      medium
                    </span>
                  </td>
                  <td className="px-3 py-2">VIGIA-A1-{238 + i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}