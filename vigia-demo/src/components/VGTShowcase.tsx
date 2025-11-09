// components/VgtTokenHero.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

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

function StatCard({
  title,
  children,
  icon,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      whileHover={{ 
        y: -4,
        scale: 1.02,
        transition: { 
          type: "spring",
          stiffness: 400,
          damping: 20
        }
      }}
      whileTap={{ scale: 0.98 }}
      className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg transition-all duration-300 hover:border-cyan-400/30 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] cursor-pointer"
    >
      <div className="mb-3 flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {icon}
        </motion.div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </motion.div>
  );
}

export default function VgtTokenHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[.28] [mask-image:radial-gradient(60%_60%_at_50%_40%,#000_60%,transparent_100%)]">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(148,163,184,.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.1fr,0.9fr]">
        {/* LEFT: copy + actions */}
        <div>
          <motion.div {...fadeUp(0)}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-lg">
              {/* Placeholder VGT logo */}
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                <span className="text-xs font-bold text-slate-900">VGT</span>
              </div>
              <span className="text-xs font-medium text-white/70">VIGIA Token</span>
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp(0.05)}
            className="text-4xl font-semibold tracking-tight text-white md:text-6xl"
          >
            The Economic Engine of{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-fuchsia-400 bg-clip-text text-transparent">
                the VIGIA Network
              </span>
              <motion.span
                aria-hidden
                initial={{ x: "-120%" }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ 
                  duration: 2.2, 
                  repeat: Infinity, 
                  ease: "easeInOut" as const 
                }}
                className="pointer-events-none absolute -inset-y-1 -inset-x-1 block bg-gradient-to-r from-transparent via-white/30 to-transparent [mask-image:linear-gradient(90deg,transparent,black,transparent)]"
              />
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.15)}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300"
          >
            The <strong className="text-cyan-300">VGT</strong> token rewards contributors who power VIGIA
            with fresh road-hazard data. Whether you're capturing imagery on-device,
            validating AI detections, or curating Geo-RAG memory, your work is
            tracked on-chain and rewarded transparently.
          </motion.p>

          <motion.div {...fadeUp(0.25)} className="mt-8 flex flex-wrap items-center gap-3">
            <motion.div 
              {...springTap}
              whileHover={{ 
                boxShadow: "0 20px 40px rgba(6, 182, 212, 0.3)",
              }}
            >
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl"
              >
                Documentation
                <motion.span
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
            <motion.div 
              {...springTap}
              whileHover={{ 
                borderColor: "rgba(6, 182, 212, 0.5)",
                backgroundColor: "rgba(6, 182, 212, 0.1)",
              }}
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-white/90 backdrop-blur-lg transition-all hover:bg-white/10 hover:border-white/25"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Open Wallet
              </Link>
            </motion.div>
            <motion.div 
              {...springTap}
              whileHover={{ 
                borderColor: "rgba(168, 85, 247, 0.5)",
                backgroundColor: "rgba(168, 85, 247, 0.1)",
              }}
            >
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-white/90 backdrop-blur-lg transition-all hover:bg-white/10 hover:border-white/25"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                Build with VGT
              </Link>
            </motion.div>
          </motion.div>

          {/* Info cards */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Data Usage"
              delay={0.1}
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
              }
            >
              Developers redeem VGT for API credits, hazard tiles, and Geo-RAG
              queries. Network fees recycle value to contributors.
            </StatCard>

            <StatCard
              title="VGT Burn"
              delay={0.15}
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              }
            >
              A portion of redemptions is burned; another portion flows to
              the rewards pool, aligning usage with long-term scarcity.
            </StatCard>

            <StatCard
              title="Sustainable Economics"
              delay={0.2}
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              }
            >
              Earn for verified contributions; spend for premium maps, alerts,
              and SDK features—closing the loop between supply and demand.
            </StatCard>
          </div>
        </div>

        {/* RIGHT: phone mock / wallet preview */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" as const }}
          whileHover={{ scale: 1.02 }}
          className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300"
        >
          <motion.div 
            className="mb-4 text-sm font-medium text-white/80"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Wallet Preview
          </motion.div>

          {/* Glassy phone frame */}
          <motion.div 
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-1 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
          >
            <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
              {/* Wallet UI Mockup */}
              <div className="absolute inset-0 p-6">
                {/* Header */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-900">VGT</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Contributor Wallet</div>
                      <div className="text-sm font-semibold text-white">0x742d...3f8a</div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Balance Card */}
                <motion.div 
                  className="mb-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-4 ring-1 ring-white/10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(6, 182, 212, 0.2)" }}
                >
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Total Balance</div>
                  <motion.div 
                    className="mt-1 text-3xl font-bold text-white"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                  >
                    12,186.35 <span className="text-xl text-slate-400">VGT</span>
                  </motion.div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1"
                        initial={{ width: 0, opacity: 0 }}
                        whileInView={{ width: "auto", opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                        <span className="text-xs font-semibold text-emerald-400">+2.6%</span>
                      </motion.div>
                      <motion.span 
                        className="text-xs text-slate-500"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8 }}
                      >
                        +1,320 VGT
                      </motion.span>
                    </div>
                    <motion.div 
                      className="text-xs text-slate-500"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 }}
                    >
                      Last 30 days
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Activity */}
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.7
                      }
                    }
                  }}
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 }
                    }}
                    className="text-xs text-slate-400 uppercase tracking-wide mb-3"
                  >
                    Recent Activity
                  </motion.div>
                  <div className="space-y-2">
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">Hazard Validated</div>
                          <div className="text-xs text-slate-500">Pothole • Mumbai</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-emerald-400">+15.5 VGT</div>
                        <div className="text-xs text-slate-500">2h ago</div>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">V2X Contribution</div>
                          <div className="text-xs text-slate-500">Network consensus</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-cyan-400">+8.2 VGT</div>
                        <div className="text-xs text-slate-500">5h ago</div>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">Data Contribution</div>
                          <div className="text-xs text-slate-500">25km coverage</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-purple-400">+12.0 VGT</div>
                        <div className="text-xs text-slate-500">8h ago</div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Stats chips overlay */}
            <div className="pointer-events-none absolute left-4 top-4 grid gap-2">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white/90 backdrop-blur-lg ring-1 ring-white/10"
              >
                Balance <span className="font-mono font-semibold">12,186.35 VGT</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-200 backdrop-blur-lg ring-1 ring-emerald-500/30"
              >
                +1,320 <span className="text-emerald-300 font-semibold">+2.6%</span>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA row under preview */}
          <motion.div 
            className="mt-6 flex flex-wrap items-center justify-between gap-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
          >
            <motion.div 
              className="text-sm text-slate-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.0 }}
            >
              Rewards tracked on-chain • Transparent distribution
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.div 
                {...springTap}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.1 }}
                whileHover={{ 
                  borderColor: "rgba(6, 182, 212, 0.5)",
                  backgroundColor: "rgba(6, 182, 212, 0.1)",
                }}
              >
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-lg transition-all hover:bg-white/10 hover:border-white/25"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Pricing
                </Link>
              </motion.div>
              <motion.div 
                {...springTap}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2 }}
                whileHover={{ 
                  boxShadow: "0 10px 30px rgba(255, 255, 255, 0.3)",
                }}
              >
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Start Earning
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Decorative glow */}
          <motion.div 
            className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.25, 0.2]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}