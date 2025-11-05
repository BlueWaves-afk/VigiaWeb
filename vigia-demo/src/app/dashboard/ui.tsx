// src/app/dashboard/ui.tsx
"use client";

import React, { useMemo, useState } from "react";

/* ----------------------------- Types & Constants ---------------------------- */
type UserLite = { id: string; email?: string };

type Hazard = { id: string; x: number; y: number; severity: number };
type VerifiedHazard = Hazard;

const WORLD = { w: 900, h: 520 };
const GRID = 60; // grid background for map
const DEDUPE_RADIUS = 28; // "DBSCAN-like" radius for dedupe
const VGT_PER_VALIDATION = 2; // mint per validated hazard (supply side)
const VGT_PER_CREDIT = 0.1; // burn rate: 0.1 VGT -> 1 Data Credit (demand side)

/* --------------------------------- Helpers --------------------------------- */
function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// tiny proximity-dedupe (DBSCAN-ish)
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

/* ------------------------------- Client UI --------------------------------- */
export default function DashboardClient({ user }: { user: UserLite }) {
  /* Supply-side (driver) state */
  const [km, setKm] = useState(0);
  const [haz, setHaz] = useState(0);
  const [validated, setValidated] = useState(0);
  const [vgt, setVgt] = useState(0);

  /* Demand-side (enterprise) state */
  const [treasuryVGT, setTreasuryVGT] = useState(250); // OEM treasury for demo
  const [dataCredits, setDataCredits] = useState(200); // available credits
  const [buyCredits, setBuyCredits] = useState(1000);

  // network hazards -> verified (blue) after dedupe
  const [networkHazards, setNetworkHazards] = useState<Hazard[]>(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: `HZ${i + 1}`,
      x: rand(40, WORLD.w - 40),
      y: rand(40, WORLD.h - 40),
      severity: rand(0.3, 1),
    })),
  );

  const verified = useMemo(() => dedupe(networkHazards, DEDUPE_RADIUS), [networkHazards]);

  /* ------------------------------- Interactions ------------------------------ */
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
      alert("Insufficient VGT in OEM treasury to burn for these credits.");
      return;
    }
    setTreasuryVGT((v) => v - costVGT);
    setDataCredits((c) => c + credits);
  }

  function pullVerifiedHazards() {
    // consume credits (1 credit per 10 hazards “page”)
    const perPage = 10;
    const pages = Math.ceil(verified.length / perPage);
    const need = pages;
    if (dataCredits < need) {
      alert(`Not enough Data Credits. Need ${need}, have ${dataCredits}.`);
      return;
    }
    setDataCredits((c) => c - need);
    // rotate hazards a bit to show freshness
    setNetworkHazards((prev) =>
      prev.map((h) => ({
        ...h,
        x: clamp(h.x + rand(-24, 24), 24, WORLD.w - 24),
        y: clamp(h.y + rand(-24, 24), 24, WORLD.h - 24),
      })),
    );
  }

  /* ---------------------------------- UI ---------------------------------- */
  const [tab, setTab] = useState<"contrib" | "enterprise">("contrib");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">VIGIA Network Dashboard</h1>
          <p className="text-white/60">
            Signed in as <span className="font-medium">{user.email ?? user.id}</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-1 text-white/80">
          <button
            onClick={() => setTab("contrib")}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === "contrib" ? "bg-white text-slate-900" : "hover:bg-white/10"}`}
          >
            Contributor View
          </button>
          <button
            onClick={() => setTab("enterprise")}
            className={`ml-1 rounded-lg px-3 py-1.5 text-sm ${tab === "enterprise" ? "bg-white text-slate-900" : "hover:bg-white/10"}`}
          >
            Enterprise View
          </button>
        </div>
      </div>

      {tab === "contrib" ? (
        /* --------------------------- Contributor View --------------------------- */
        <div className="grid gap-6 lg:grid-cols-[minmax(620px,1fr)_360px]">
          {/* KPIs + Sim */}
          <div className="card-glass p-4">
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <KPI label="Kilometers Driven" value={`${km} km`} />
              <KPI label="Hazards Detected" value={haz} />
              <KPI label="Data Validated (DBSCAN)" value={validated} />
              <KPI label="VGT Earned" value={`${vgt.toFixed(1)} VGT`} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="simDrive"
                onClick={simulate10km}
                className="rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600"
              >
                Simulate 10km Drive
              </button>

              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
                Minting rule: <b>{VGT_PER_VALIDATION} VGT</b> per validated hazard
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              This view represents the **supply side** of the network. Press the button to simulate “Proof of
              Physical Work”—distance driven, hazards observed, then *validated* via DBSCAN before minting VGT.
            </div>
          </div>

          {/* Wallet */}
          <div className="space-y-4">
            <div className="card-glass p-4">
              <h3 className="mb-3 text-white/90">My Wallet</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-black/30 p-3">
                  <div className="text-white/60">VIGIA Tokens (VGT)</div>
                  <div className="text-xl font-semibold text-white">{vgt.toFixed(1)}</div>
                </div>
                <div className="rounded-lg bg-black/30 p-3">
                  <div className="text-white/60">Role</div>
                  <div className="text-xl font-semibold text-white">Contributor</div>
                </div>
              </div>
            </div>

            <div className="card-glass p-4 text-sm text-white/70">
              Your *validated* contributions feed the **Enterprise View**, where OEMs consume verified, deduplicated
              hazard data via credits that **burn** VGT—closing the DePIN flywheel.
            </div>
          </div>
        </div>
      ) : (
        /* --------------------------- Enterprise View --------------------------- */
        <div className="grid gap-6 lg:grid-cols-[minmax(620px,1fr)_360px]">
          {/* Map */}
          <div className="card-glass relative overflow-hidden p-3">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
                backgroundSize: `${GRID}px ${GRID}px`,
              }}
            />
            <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="relative z-10 w-full rounded-lg">
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

          {/* Credits + Burn widget */}
          <div className="space-y-4">
            <div className="card-glass p-4">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-black/30 p-3">
                  <div className="text-white/60 text-sm">Available Data Credits</div>
                  <div className="text-2xl font-semibold text-white">{dataCredits}</div>
                </div>
                <div className="rounded-lg bg-black/30 p-3">
                  <div className="text-white/60 text-sm">OEM Treasury (VGT)</div>
                  <div className="text-2xl font-semibold text-white">{treasuryVGT.toFixed(1)}</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 text-white/90">Purchase Data Credits</div>
                <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
                  <div>
                    <label className="text-xs text-white/60">Credits</label>
                    <input
                      type="number"
                      value={buyCredits}
                      onChange={(e) => setBuyCredits(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div className="hidden md:block"></div>
                  <div>
                    <label className="text-xs text-white/60">Cost (VGT – burned)</label>
                    <input
                      disabled
                      value={(buyCredits * VGT_PER_CREDIT).toFixed(1)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white/70 outline-none"
                    />
                  </div>
                  <button
                    onClick={purchaseCredits}
                    className="mt-2 rounded-xl bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-100 md:mt-0"
                  >
                    Burn & Acquire
                  </button>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  Rate: <b>1 credit = {VGT_PER_CREDIT} VGT</b> (burned). Credits grant access to the verified hazard API.
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={pullVerifiedHazards}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Pull Verified Hazards (consumes credits)
                </button>
                <code className="rounded-lg bg-black/30 px-2 py-1 text-xs text-white/70">
                  GET /api/vigia/verified-hazards
                </code>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                This view represents the **demand side**. Enterprises **burn VGT** to purchase **Data Credits**, then
                consume the **deduplicated, verified** hazard stream for ADAS insights, mapping QA, and fleet safety.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Atoms --------------------------------- */
function KPI({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

/* ------------------------------ Tailwind note ------------------------------ */
/* This file assumes you have:
   .card-glass { @apply rounded-2xl border border-white/10 bg-black/30 backdrop-blur shadow-xl; }
*/