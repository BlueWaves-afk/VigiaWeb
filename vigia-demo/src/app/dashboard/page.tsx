// src/app/dashboard/page.tsx
import PageShell from "@/components/PageShell";

export const metadata = { title: "Dashboard • VIGIA" };

function Stat({ label, value, foot }: { label: string; value: string; foot?: string }) {
  return (
    <div className="card-glass p-5">
      <div className="text-white/70 text-xs">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {foot && <div className="mt-1 text-xs text-white/50">{foot}</div>}
    </div>
  );
}

export default function Dashboard() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Live safety signals, model health and marketplace activity."
    >
      {/* KPI band */}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Active devices" value="1,284" foot="+3.1% vs last week" />
        <Stat label="Hazards today" value="8,417" foot="↗︎ 12% since 9 AM" />
        <Stat label="Avg TTS latency" value="118 ms" foot="p95 162 ms" />
        <Stat label="Tokens earned" value="34,510 VGT" foot="24h accrual" />
      </div>

      {/* Two-up charts/cards */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card-glass p-6">
          <div className="mb-3 text-white/80 text-sm">Hazard density (last 24h)</div>
          <div className="h-64 rounded-lg border border-white/10 bg-black/20" />
        </div>
        <div className="card-glass p-6">
          <div className="mb-3 text-white/80 text-sm">Model health</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• argus_v8x.onnx (edge) — healthy</li>
            <li>• quant config — INT8, pass</li>
            <li>• false positives (p95) — 1.8%</li>
            <li>• export pipeline — last run 2h ago</li>
          </ul>
        </div>
      </div>

      {/* Table card */}
      <div className="mt-6 card-glass p-6 overflow-hidden">
        <div className="mb-3 text-white/80 text-sm">Recent events</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th>Time</th><th>Type</th><th>City</th><th>Severity</th><th>Device</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td className="px-3 py-2">14:{(30+i).toString().padStart(2,"0")}</td>
                  <td className="px-3 py-2">pothole</td>
                  <td className="px-3 py-2">Bengaluru</td>
                  <td className="px-3 py-2">medium</td>
                  <td className="px-3 py-2">VIGIA-A1-{238+i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}