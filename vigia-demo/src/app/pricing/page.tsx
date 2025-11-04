// src/app/pricing/page.tsx
"use client";

import PageShell from "@/components/PageShell";

function StatRow({
  k,
  v,
  sub,
}: {
  k: string;
  v: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-white/10 last:border-none">
      <div className="text-white/75 text-sm">{k}</div>
      <div className="text-white text-sm text-right">
        {v}
        {sub && <div className="text-[11px] text-white/50">{sub}</div>}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <PageShell
      title="Pricing"
      subtitle="Transparent, DePIN-aligned pricing. Contributors earn VGT. Builders buy Data Credits (DC) to consume verified hazard data & APIs."
    >
      {/* Toggle note */}
      <div className="card-glass p-4 text-xs text-white/60">
        Demo pricing for hackathon/judge review. Numbers are adjustable via
        Supabase (tables: <code>pricing</code>, <code>wallets</code>,
        <code>tx_ledger</code>).
      </div>

      {/* Tiers */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Contributor */}
        <div className="card-glass p-6">
          <div className="text-white/70 text-sm mb-1">For drivers & cameras</div>
          <h3 className="text-2xl text-white font-semibold">Contributor</h3>
          <div className="mt-4 text-4xl text-emerald-300 font-semibold">
            Earn VGT
          </div>
          <div className="text-xs text-white/60">per validated data unit</div>

          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li>• Earn on-device detections + GPS traces</li>
            <li>• Extra for high-confidence / rare hazards</li>
            <li>• Validation boosts via oracles (DBSCAN, QoS)</li>
            <li>• Slashing for spam/low integrity</li>
          </ul>

          <div className="mt-6 text-xs text-white/60">
            Payout split (demo): 70% to Contributor, 20% to Validators, 10% to Protocol.
          </div>
        </div>

        {/* Developer */}
        <div className="card-glass p-6 ring-1 ring-white/15">
          <div className="text-white/70 text-sm mb-1">For apps & APIs</div>
          <h3 className="text-2xl text-white font-semibold">Developer</h3>

          <div className="mt-4 flex items-end gap-2">
            <div className="text-4xl text-white font-semibold">$99</div>
            <div className="text-white/60">/ mo</div>
          </div>
          <div className="text-xs text-white/60">includes 1M DC (Data Credits)</div>

          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li>• REST/WebSocket hazard stream</li>
            <li>• 10M map tile requests / mo</li>
            <li>• 100k replay queries / mo</li>
            <li>• V2X relay: first 500k msgs / mo</li>
          </ul>

          <div className="mt-6 text-xs text-white/60">
            Overages (demo): $0.80 per +1M DC, $1.5 per +1M tiles,
            $0.50 per +100k V2X msgs.
          </div>
        </div>

        {/* Enterprise */}
        <div className="card-glass p-6">
          <div className="text-white/70 text-sm mb-1">For fleets & cities</div>
          <h3 className="text-2xl text-white font-semibold">Enterprise</h3>

          <div className="mt-4 text-4xl text-white font-semibold">Custom</div>
          <div className="text-xs text-white/60">SLAs, private tenancy, SSO</div>

          <ul className="mt-6 space-y-2 text-sm text-white/80">
            <li>• Dedicated ingest & validators</li>
            <li>• Private geofences & retention policies</li>
            <li>• Custom tokens/DC treasury & on-prem bridges</li>
            <li>• Priority support & training</li>
          </ul>

          <div className="mt-6 text-xs text-white/60">
            Includes co-branded marketplace & revenue shares.
          </div>
        </div>
      </div>

      {/* DePIN economics */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card-glass p-6">
          <div className="text-white/80 text-sm mb-3">How value flows (demo)</div>
          <div className="text-white/90 text-sm leading-6">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <span className="text-cyan-300">Developers</span> buy{" "}
                <strong>Data Credits (DC)</strong> with fiat/crypto.
              </li>
              <li>
                API usage <em>burns</em> DC → creates a revenue pool for the block/epoch.
              </li>
              <li>
                Pool splits: <strong>70%</strong> Contributors,{" "}
                <strong>20%</strong> Validators/Oracles, <strong>10%</strong> Protocol/Treasury.
              </li>
              <li>
                Rewards paid in <strong>VGT</strong> (minted against DC burn), with optional vesting.
              </li>
              <li>
                Anti-spam: stake-to-send for devices, quality score multiplier, slashing for abuse.
              </li>
            </ol>
          </div>
        </div>

        <div className="card-glass p-6">
          <div className="text-white/80 text-sm mb-3">Unit costs (suggested)</div>
          <StatRow
            k="Hazard read (stream/replay)"
            v="1 DC / event"
            sub="Includes geo, type, severity, device anonymized hash"
          />
          <StatRow
            k="Map tile request"
            v="0.05 DC / tile"
            sub="Raster/Vector CDN tile"
          />
          <StatRow
            k="V2X relay message"
            v="0.1 DC / msg"
            sub="Signed, rate-limited"
          />
          <StatRow
            k="Batch export"
            v="1000 DC / GB"
            sub="S3-compatible bundle"
          />
          <StatRow
            k="Model inference (cloud)"
            v="variable"
            sub="Pass-through at cost + small margin"
          />
        </div>
      </div>

      {/* Marketplace fees */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="card-glass p-6">
          <div className="text-white/70 text-sm mb-1">Protocol fee</div>
          <div className="text-3xl text-white font-semibold">10%</div>
          <div className="mt-2 text-sm text-white/80">
            From burned-DC pool. Funds ops, security bounties, & R&D.
          </div>
        </div>
        <div className="card-glass p-6">
          <div className="text-white/70 text-sm mb-1">Validator pool</div>
          <div className="text-3xl text-white font-semibold">20%</div>
          <div className="mt-2 text-sm text-white/80">
            DBSCAN/oracle nodes, triangulation, QoS audits, dispute resolution.
          </div>
        </div>
        <div className="card-glass p-6">
          <div className="text-white/70 text-sm mb-1">Contributor rewards</div>
          <div className="text-3xl text-emerald-300 font-semibold">70%</div>
          <div className="mt-2 text-sm text-white/80">
            Weighted by confidence, novelty, coverage, & device reputation.
          </div>
        </div>
      </div>

      {/* Example calculations */}
      <div className="mt-8 card-glass p-6">
        <div className="text-white/80 text-sm mb-3">Worked examples</div>

        <div className="grid gap-6 md:grid-cols-3 text-sm">
          <div className="rounded-lg bg-white/5 p-4">
            <div className="text-white/70 mb-1">App using 5M events / mo</div>
            <div className="text-white">
              Needs <span className="font-semibold">5M DC</span>. Dev plan (1M DC) +{" "}
              4M overage @ $0.80/M ⇒{" "}
              <span className="font-semibold">$99 + $3.20 = $102.20</span>.
            </div>
          </div>

          <div className="rounded-lg bg-white/5 p-4">
            <div className="text-white/70 mb-1">Pool distribution (5M DC)</div>
            <div className="text-white">
              Burn creates pool. Split: <strong>3.5M</strong> DC → Contributors,{" "}
              <strong>1.0M</strong> → Validators, <strong>0.5M</strong> → Protocol.
            </div>
          </div>

          <div className="rounded-lg bg-white/5 p-4">
            <div className="text-white/70 mb-1">Contributor device (demo)</div>
            <div className="text-white">
              12k validated events in epoch with 1.5× quality multiplier ⇒
              proportional share ≈ <strong>18k “DC-equiv”</strong> paid as{" "}
              <strong>VGT</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="mt-8 card-glass p-6">
        <div className="text-white/80 text-sm mb-3">FAQ (quick)</div>
        <ul className="space-y-3 text-sm text-white/85">
          <li>
            <span className="text-white/60">Why DC + VGT?</span>{" "}
            DC gives predictable pricing in fiat; VGT aligns incentives and
            rewards supply-side growth.
          </li>
          <li>
            <span className="text-white/60">Is there device staking?</span>{" "}
            Yes (demo): small VGT stake to publish; slashing on spam/abuse.
          </li>
          <li>
            <span className="text-white/60">Can I run validators?</span>{" "}
            Yes—DBSCAN/oracle nodes earn 20% of the pool according to QoS.
          </li>
          <li>
            <span className="text-white/60">On-chain gas?</span>{" "}
            Abstracted; DC burn/settlement batched. Optional L2 bridge later.
          </li>
        </ul>
      </div>
    </PageShell>
  );
}