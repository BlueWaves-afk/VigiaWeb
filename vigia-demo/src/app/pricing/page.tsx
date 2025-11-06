// src/app/pricing/page.tsx
"use client";

import PageShell from "@/components/PageShell";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

const springTap = {
  whileHover: { 
    y: -2, 
    scale: 1.02, 
    transition: { 
      type: "spring" as const, 
      stiffness: 400, 
      damping: 25 
    } 
  },
  whileTap: { scale: 0.98, y: 0 },
};

function StatRow({
  k,
  v,
  sub,
  delay = 0,
}: {
  k: string;
  v: string;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-start justify-between py-3 border-b border-white/10 last:border-none group hover:bg-white/5 hover:border-white/20 rounded-lg px-3 -mx-3 transition-all"
    >
      <div className="text-slate-300 text-sm group-hover:text-white transition-colors">{k}</div>
      <div className="text-white text-sm text-right">
        {v}
        {sub && <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{sub}</div>}
      </div>
    </motion.div>
  );
}

function PricingCard({ 
  children, 
  featured = false,
  delay = 0 
}: { 
  children: React.ReactNode; 
  featured?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`rounded-2xl border backdrop-blur-lg p-6 transition-all ${
        featured 
          ? "border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 ring-1 ring-cyan-400/20 shadow-xl shadow-cyan-500/10" 
          : "border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 hover:border-white/20 hover:shadow-lg"
      }`}
    >
      {children}
    </motion.div>
  );
}

export default function PricingPage() {
  return (
    <PageShell
      title="Pricing"
      subtitle="Transparent, DePIN-aligned pricing. Contributors earn VGT. Builders buy Data Credits (DC) to consume verified hazard data & APIs."
    >
      {/* Toggle note */}
      <motion.div
        {...fadeUp(0)}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-4 text-sm text-slate-300 backdrop-blur-lg"
      >
        Demo pricing for hackathon/judge review. Numbers are adjustable via
        Supabase (tables: <code className="text-cyan-300">pricing</code>, <code className="text-cyan-300">wallets</code>,
        <code className="text-cyan-300">tx_ledger</code>).
      </motion.div>

      {/* Tiers */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Contributor */}
        <PricingCard delay={0.1}>
          <div className="text-slate-300 text-sm mb-2">For drivers & cameras</div>
          <h3 className="text-2xl text-white font-semibold">Contributor</h3>
          <div className="mt-4 text-4xl text-emerald-300 font-semibold">
            Earn VGT
          </div>
          <div className="text-sm text-slate-400">per validated data unit</div>

          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              Earn on-device detections + GPS traces
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              Extra for high-confidence / rare hazards
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              Validation boosts via oracles (DBSCAN, QoS)
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              Slashing for spam/low integrity
            </li>
          </ul>

          <div className="mt-6 text-xs text-slate-400 border-t border-white/10 pt-4">
            Payout split (demo): 70% to Contributor, 20% to Validators, 10% to Protocol.
          </div>
        </PricingCard>

        {/* Developer */}
        <PricingCard featured delay={0.15}>
          <div className="text-slate-300 text-sm mb-2">For apps & APIs</div>
          <h3 className="text-2xl text-white font-semibold">Developer</h3>

          <div className="mt-4 flex items-end gap-2">
            <div className="text-4xl text-white font-semibold">$99</div>
            <div className="text-slate-300">/ mo</div>
          </div>
          <div className="text-sm text-slate-400">includes 1M DC (Data Credits)</div>

          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              REST/WebSocket hazard stream
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              10M map tile requests / mo
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              100k replay queries / mo
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              V2X relay: first 500k msgs / mo
            </li>
          </ul>

          <div className="mt-6 text-xs text-slate-400 border-t border-white/10 pt-4">
            Overages (demo): $0.80 per +1M DC, $1.5 per +1M tiles,
            $0.50 per +100k V2X msgs.
          </div>
        </PricingCard>

        {/* Enterprise */}
        <PricingCard delay={0.2}>
          <div className="text-slate-300 text-sm mb-2">For fleets & cities</div>
          <h3 className="text-2xl text-white font-semibold">Enterprise</h3>

          <div className="mt-4 text-4xl text-white font-semibold">Custom</div>
          <div className="text-sm text-slate-400">SLAs, private tenancy, SSO</div>

          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              Dedicated ingest & validators
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              Private geofences & retention policies
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              Custom tokens/DC treasury & on-prem bridges
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              Priority support & training
            </li>
          </ul>

          <div className="mt-6 text-xs text-slate-400 border-t border-white/10 pt-4">
            Includes co-branded marketplace & revenue shares.
          </div>
        </PricingCard>
      </div>

      {/* DePIN economics */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <motion.div
          {...fadeUp(0.25)}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg"
        >
          <div className="text-white text-sm mb-4 font-semibold">How value flows (demo)</div>
          <div className="text-slate-300 text-sm leading-6 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
              <span>
                <span className="text-cyan-300 font-medium">Developers</span> buy{" "}
                <strong>Data Credits (DC)</strong> with fiat/crypto.
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
              <span>
                API usage <em>burns</em> DC → creates a revenue pool for the block/epoch.
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
              <span>
                Pool splits: <strong className="text-emerald-300">70%</strong> Contributors,{" "}
                <strong className="text-amber-300">20%</strong> Validators/Oracles, <strong className="text-purple-300">10%</strong> Protocol/Treasury.
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-start gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
              <span>
                Rewards paid in <strong className="text-emerald-300">VGT</strong> (minted against DC burn), with optional vesting.
              </span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          {...fadeUp(0.3)}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg"
        >
          <div className="text-white text-sm mb-4 font-semibold">Unit costs (suggested)</div>
          <div className="space-y-1">
            <StatRow
              k="Hazard read (stream/replay)"
              v="1 DC / event"
              sub="Includes geo, type, severity, device anonymized hash"
              delay={0.1}
            />
            <StatRow
              k="Map tile request"
              v="0.05 DC / tile"
              sub="Raster/Vector CDN tile"
              delay={0.15}
            />
            <StatRow
              k="V2X relay message"
              v="0.1 DC / msg"
              sub="Signed, rate-limited"
              delay={0.2}
            />
            <StatRow
              k="Batch export"
              v="1000 DC / GB"
              sub="S3-compatible bundle"
              delay={0.25}
            />
            <StatRow
              k="Model inference (cloud)"
              v="variable"
              sub="Pass-through at cost + small margin"
              delay={0.3}
            />
          </div>
        </motion.div>
      </div>

      {/* Marketplace fees */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <motion.div
          {...fadeUp(0.35)}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg text-center"
        >
          <div className="text-slate-300 text-sm mb-2">Protocol fee</div>
          <div className="text-4xl text-purple-300 font-semibold">10%</div>
          <div className="mt-3 text-sm text-slate-300">
            From burned-DC pool. Funds ops, security bounties, & R&D.
          </div>
        </motion.div>
        <motion.div
          {...fadeUp(0.4)}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg text-center"
        >
          <div className="text-slate-300 text-sm mb-2">Validator pool</div>
          <div className="text-4xl text-amber-300 font-semibold">20%</div>
          <div className="mt-3 text-sm text-slate-300">
            DBSCAN/oracle nodes, triangulation, QoS audits, dispute resolution.
          </div>
        </motion.div>
        <motion.div
          {...fadeUp(0.45)}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg text-center"
        >
          <div className="text-slate-300 text-sm mb-2">Contributor rewards</div>
          <div className="text-4xl text-emerald-300 font-semibold">70%</div>
          <div className="mt-3 text-sm text-slate-300">
            Weighted by confidence, novelty, coverage, & device reputation.
          </div>
        </motion.div>
      </div>

      {/* Example calculations */}
      <motion.div
        {...fadeUp(0.5)}
        className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg"
      >
        <div className="text-white text-sm mb-4 font-semibold">Worked examples</div>

        <div className="grid gap-6 md:grid-cols-3 text-sm">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-xl bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="text-slate-300 mb-2">App using 5M events / mo</div>
            <div className="text-white">
              Needs <span className="font-semibold text-cyan-300">5M DC</span>. Dev plan (1M DC) +{" "}
              4M overage @ $0.80/M ⇒{" "}
              <span className="font-semibold text-emerald-300">$99 + $3.20 = $102.20</span>.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="text-slate-300 mb-2">Pool distribution (5M DC)</div>
            <div className="text-white">
              Burn creates pool. Split: <strong className="text-emerald-300">3.5M</strong> DC → Contributors,{" "}
              <strong className="text-amber-300">1.0M</strong> → Validators, <strong className="text-purple-300">0.5M</strong> → Protocol.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="rounded-xl bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="text-slate-300 mb-2">Contributor device (demo)</div>
            <div className="text-white">
              12k validated events in epoch with 1.5× quality multiplier ⇒
              proportional share ≈ <strong className="text-emerald-300">18k "DC-equiv"</strong> paid as{" "}
              <strong className="text-emerald-300">VGT</strong>.
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* FAQs */}
      <motion.div
        {...fadeUp(0.7)}
        className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg"
      >
        <div className="text-white text-sm mb-4 font-semibold">FAQ (quick)</div>
        <ul className="space-y-4 text-sm">
          <motion.li
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75 }}
            className="text-slate-300"
          >
            <span className="text-cyan-300 font-medium">Why DC + VGT?</span>{" "}
            DC gives predictable pricing in fiat; VGT aligns incentives and
            rewards supply-side growth.
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="text-slate-300"
          >
            <span className="text-cyan-300 font-medium">Is there device staking?</span>{" "}
            Yes (demo): small VGT stake to publish; slashing on spam/abuse.
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.85 }}
            className="text-slate-300"
          >
            <span className="text-cyan-300 font-medium">Can I run validators?</span>{" "}
            Yes—DBSCAN/oracle nodes earn 20% of the pool according to QoS.
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="text-slate-300"
          >
            <span className="text-cyan-300 font-medium">On-chain gas?</span>{" "}
            Abstracted; DC burn/settlement batched. Optional L2 bridge later.
          </motion.li>
        </ul>
      </motion.div>
    </PageShell>
  );
}