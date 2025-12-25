"use client";

import { useMemo, useState } from "react";

type UserLite = { id: string; email?: string };
type Hazard = { id: string; x: number; y: number; severity: number };
type VerifiedHazard = Hazard;

const WORLD = { w: 900, h: 520 };
const DEDUPE_RADIUS = 28;
const VGT_PER_VALIDATION = 2;
const VGT_PER_CREDIT = 0.1;

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function dedupe(hz: Hazard[], r = DEDUPE_RADIUS): VerifiedHazard[] {
  const out: VerifiedHazard[] = [];
  const used = new Set<string>();
  for (let i = 0; i < hz.length; i++) {
    if (used.has(hz[i].id)) continue;
    const group = [hz[i]];
    used.add(hz[i].id);
    for (let j = i + 1; j < hz.length; j++) {
      if (used.has(hz[j].id)) continue;
      const d = Math.hypot(hz[i].x - hz[j].x, hz[i].y - hz[j].y);
      if (d <= r) {
        group.push(hz[j]);
        used.add(hz[j].id);
      }
    }
    const rep = group.reduce((a, b) => (b.severity > a.severity ? b : a));
    out.push(rep);
  }
  return out;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export default function DashboardClient({ user }: { user: UserLite }) {
  /* Supply-side state */
  const [km, setKm] = useState(0);
  const [haz, setHaz] = useState(0);
  const [validated, setValidated] = useState(0);
  const [vgt, setVgt] = useState(0);

  /* Demand-side state */
  const [treasuryVGT, setTreasuryVGT] = useState(250);
  const [dataCredits, setDataCredits] = useState(200);
  const [buyCredits, setBuyCredits] = useState(1000);

  const [networkHazards, setNetworkHazards] = useState<Hazard[]>(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: `HZ${i + 1}`,
      x: rand(40, WORLD.w - 40),
      y: rand(40, WORLD.h - 40),
      severity: rand(0.3, 1),
    })),
  );

  const verified = useMemo(() => dedupe(networkHazards, DEDUPE_RADIUS), [networkHazards]);

  const [tab, setTab] = useState<"contrib" | "enterprise">("contrib");

  function simulate10km() {
    const newKm = km + 10;
    const detectedNow = Math.floor(rand(2, 7));
    const validatedNow = Math.max(0, Math.round(detectedNow * rand(0.6, 0.8)));
    setKm(newKm);
    setHaz(haz + detectedNow);
    setValidated(validated + validatedNow);
    setVgt((v) => v + validatedNow * VGT_PER_VALIDATION);
  }

  function purchaseCredits() {
    const credits = Math.max(0, Math.floor(buyCredits));
    const costVGT = credits * VGT_PER_CREDIT;
    if (credits === 0) return;
    if (treasuryVGT < costVGT) {
      alert("Insufficient VGT in treasury.");
      return;
    }
    setTreasuryVGT((v) => v - costVGT);
    setDataCredits((c) => c + credits);
  }

  function pullVerifiedHazards() {
    const perPage = 10;
    const pages = Math.ceil(verified.length / perPage);
    const need = pages;
    if (dataCredits < need) {
      alert(`Need ${need} credits, have ${dataCredits}.`);
      return;
    }
    setDataCredits((c) => c - need);
    setNetworkHazards((prev) =>
      prev.map((h) => ({
        ...h,
        x: clamp(h.x + rand(-24, 24), 24, WORLD.w - 24),
        y: clamp(h.y + rand(-24, 24), 24, WORLD.h - 24),
      })),
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white light:text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400 light:text-slate-600">
          {user.email ?? user.id}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1 light:border-slate-200 light:bg-white">
        <button
          onClick={() => setTab("contrib")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "contrib"
              ? "bg-white text-slate-900 light:bg-slate-900 light:text-white"
              : "text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900"
          }`}
        >
          Contributor
        </button>
        <button
          onClick={() => setTab("enterprise")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "enterprise"
              ? "bg-white text-slate-900 light:bg-slate-900 light:text-white"
              : "text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900"
          }`}
        >
          Enterprise
        </button>
      </div>

      {tab === "contrib" ? (
        /* Contributor View */
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Stats & Simulation */}
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Kilometers" value={`${km} km`} />
              <StatCard label="Detected" value={haz} />
              <StatCard label="Validated" value={validated} />
              <StatCard label="VGT Earned" value={`${vgt.toFixed(1)}`} />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 light:border-slate-200 light:bg-white">
              <button
                onClick={simulate10km}
                className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
              >
                Simulate 10km Drive
              </button>
              <p className="mt-4 text-sm text-slate-400 light:text-slate-600">
                Simulates proof of physical work: distance driven, hazards detected, and validated via DBSCAN before minting VGT.
              </p>
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 light:border-slate-200 light:bg-white">
            <h3 className="mb-4 text-lg font-semibold text-white light:text-slate-900">
              My Wallet
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 light:text-slate-600">
                  VGT Balance
                </div>
                <div className="text-3xl font-semibold text-white light:text-slate-900">
                  {vgt.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 light:text-slate-600">
                  Role
                </div>
                <div className="text-lg font-medium text-white light:text-slate-900">
                  Contributor
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Enterprise View */
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Map */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 light:border-slate-200 light:bg-white">
            <svg
              viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}
              className="w-full rounded-lg"
            >
              <text x={16} y={24} fontSize={12} fill="#9ca3af">
                Verified hazard stream (deduplicated)
              </text>
              {verified.map((h) => (
                <g key={h.id} transform={`translate(${h.x}, ${h.y})`}>
                  <circle r={8} fill="#38bdf8" opacity={0.25} />
                  <circle r={5} fill="#38bdf8" />
                </g>
              ))}
            </svg>
          </div>

          {/* Credits */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 light:border-slate-200 light:bg-white">
              <h3 className="mb-4 text-lg font-semibold text-white light:text-slate-900">
                Data Credits
              </h3>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 light:text-slate-600">
                    Available
                  </div>
                  <div className="text-2xl font-semibold text-white light:text-slate-900">
                    {dataCredits}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 light:text-slate-600">
                    Treasury (VGT)
                  </div>
                  <div className="text-2xl font-semibold text-white light:text-slate-900">
                    {treasuryVGT.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-400 light:text-slate-600">
                    Credits to buy
                  </label>
                  <input
                    type="number"
                    value={buyCredits}
                    onChange={(e) => setBuyCredits(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white light:border-slate-300 light:bg-white light:text-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-slate-400 light:text-slate-600">
                    Cost (VGT burned)
                  </label>
                  <input
                    disabled
                    value={(buyCredits * VGT_PER_CREDIT).toFixed(1)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-500 light:border-slate-300 light:bg-slate-50 light:text-slate-600"
                  />
                </div>

                <button
                  onClick={purchaseCredits}
                  className="w-full rounded-full bg-white px-6 py-3 font-semibold text-slate-900 transition-all hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
                >
                  Purchase Credits
                </button>

                <button
                  onClick={pullVerifiedHazards}
                  className="w-full rounded-full border border-slate-700 px-6 py-3 font-medium text-white transition-all hover:bg-slate-900 light:border-slate-300 light:text-slate-900 light:hover:bg-slate-50"
                >
                  Pull Verified Hazards
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-400 light:text-slate-600">
                Rate: 1 credit = {VGT_PER_CREDIT} VGT (burned)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 light:border-slate-200 light:bg-white">
      <div className="text-sm text-slate-400 light:text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white light:text-slate-900">
        {value}
      </div>
    </div>
  );
}