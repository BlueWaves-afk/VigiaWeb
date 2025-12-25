"use client";

import PageShell from "@/components/PageShell";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-400 light:text-slate-600">
      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-400 light:text-cyan-600" />
      <span>{children}</span>
    </li>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  featured = false,
  delay = 0,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`relative overflow-hidden rounded-2xl border p-8 transition-all hover:border-slate-700 light:hover:border-slate-300 ${
        featured
          ? "border-cyan-500 bg-slate-900 shadow-2xl shadow-cyan-500/10 light:border-blue-500 light:bg-white light:shadow-blue-500/10"
          : "border-slate-800 bg-slate-950 light:border-slate-200 light:bg-white"
      }`}
    >
      {featured && (
        <div className="absolute right-8 top-8">
          <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-white light:bg-blue-600">
            Popular
          </span>
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-2 text-lg font-semibold text-white light:text-slate-900">
          {name}
        </h3>
        <p className="text-sm text-slate-400 light:text-slate-600">
          {description}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold text-white light:text-slate-900">
            {price}
          </span>
          {period && (
            <span className="text-slate-400 light:text-slate-600">
              {period}
            </span>
          )}
        </div>
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature, i) => (
          <Feature key={i}>{feature}</Feature>
        ))}
      </ul>

      <Link
        href="/auth/signup"
        className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition-all ${
          featured
            ? "bg-white text-slate-900 hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
            : "border border-slate-700 bg-slate-900 text-white hover:bg-slate-800 light:border-slate-300 light:bg-white light:text-slate-900 light:hover:bg-slate-50"
        }`}
      >
        {cta}
      </Link>
    </motion.div>
  );
}

export default function PricingPage() {
  return (
    <PageShell
      title="Pricing"
      subtitle="Transparent pricing for road intelligence. Contributors earn VGT. Developers buy Data Credits to consume verified hazard data."
    >
      {/* Hero Section */}
      <motion.div
        {...fadeUp(0)}
        className="mb-16 text-center"
      >
        <h1 className="mb-6 text-5xl font-semibold text-white md:text-6xl light:text-slate-900">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400 light:text-slate-600">
          Pay for what you use. No hidden fees, no surprises. Start free and scale as you grow.
        </p>
      </motion.div>

      {/* Pricing Cards */}
      <div className="mb-16 grid gap-8 md:grid-cols-3">
        <PricingCard
          name="Contributor"
          price="Earn VGT"
          description="For drivers and camera operators"
          features={[
            "Earn tokens for validated hazard data",
            "Multipliers for high-quality contributions",
            "DBSCAN validation boosts payouts",
            "Optional staking for reputation",
          ]}
          cta="Start Contributing"
          delay={0.1}
        />

        <PricingCard
          name="Developer"
          price="$99"
          period="/month"
          description="For apps and API integrations"
          features={[
            "1M Data Credits included",
            "REST & WebSocket hazard streams",
            "10M map tile requests/month",
            "100k replay queries/month",
            "500k V2X relay messages/month",
          ]}
          cta="Start Building"
          featured
          delay={0.15}
        />

        <PricingCard
          name="Enterprise"
          price="Custom"
          description="For fleets and cities"
          features={[
            "Dedicated infrastructure",
            "Custom SLAs and retention",
            "Private cloud deployment",
            "Priority support",
            "Revenue sharing options",
          ]}
          cta="Contact Sales"
          delay={0.2}
        />
      </div>

      {/* Value Flow Explanation */}
      <motion.div
        {...fadeUp(0.3)}
        className="mb-16 rounded-2xl border border-slate-800 bg-slate-950 p-8 light:border-slate-200 light:bg-white"
      >
        <h2 className="mb-6 text-2xl font-semibold text-white light:text-slate-900">
          How value flows
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-cyan-400 light:text-cyan-600">
              Supply Side
            </h3>
            <ul className="space-y-3">
              <Feature>Contributors collect road hazard data</Feature>
              <Feature>DBSCAN validates and deduplicates reports</Feature>
              <Feature>Validated data earns VGT tokens</Feature>
              <Feature>70% of revenue pool goes to contributors</Feature>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-cyan-400 light:text-cyan-600">
              Demand Side
            </h3>
            <ul className="space-y-3">
              <Feature>Developers buy Data Credits with fiat/crypto</Feature>
              <Feature>API usage burns Data Credits</Feature>
              <Feature>Burned credits fund the reward pool</Feature>
              <Feature>Creates sustainable network economics</Feature>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Token Economics */}
      <motion.div
        {...fadeUp(0.4)}
        className="mb-16 grid gap-6 md:grid-cols-3"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center light:border-slate-200 light:bg-white">
          <div className="mb-2 text-sm text-slate-400 light:text-slate-600">
            Contributors
          </div>
          <div className="mb-4 text-4xl font-semibold text-emerald-400 light:text-emerald-600">
            70%
          </div>
          <p className="text-sm text-slate-400 light:text-slate-600">
            Weighted by confidence, novelty, and device reputation
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center light:border-slate-200 light:bg-white">
          <div className="mb-2 text-sm text-slate-400 light:text-slate-600">
            Validators
          </div>
          <div className="mb-4 text-4xl font-semibold text-amber-400 light:text-amber-600">
            20%
          </div>
          <p className="text-sm text-slate-400 light:text-slate-600">
            DBSCAN nodes, oracles, and dispute resolution
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center light:border-slate-200 light:bg-white">
          <div className="mb-2 text-sm text-slate-400 light:text-slate-600">
            Protocol
          </div>
          <div className="mb-4 text-4xl font-semibold text-purple-400 light:text-purple-600">
            10%
          </div>
          <p className="text-sm text-slate-400 light:text-slate-600">
            Operations, security, and R&D
          </p>
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        {...fadeUp(0.5)}
        className="rounded-2xl border border-slate-800 bg-slate-950 p-8 light:border-slate-200 light:bg-white"
      >
        <h2 className="mb-6 text-2xl font-semibold text-white light:text-slate-900">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold text-white light:text-slate-900">
              Why Data Credits and VGT tokens?
            </h3>
            <p className="text-sm text-slate-400 light:text-slate-600">
              Data Credits give predictable fiat pricing for developers. VGT aligns incentives and rewards supply-side growth, creating sustainable network economics.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-white light:text-slate-900">
              Can I run validator nodes?
            </h3>
            <p className="text-sm text-slate-400 light:text-slate-600">
              Yes. DBSCAN and oracle nodes earn 20% of the reward pool based on quality of service and uptime.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-white light:text-slate-900">
              What about blockchain gas fees?
            </h3>
            <p className="text-sm text-slate-400 light:text-slate-600">
              Gas is abstracted. Data Credit burns and settlements are batched, with optional L2 bridge for advanced users.
            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        {...fadeUp(0.6)}
        className="mt-16 rounded-2xl border border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center light:border-blue-500 light:from-blue-500/10 light:to-cyan-500/10"
      >
        <h2 className="mb-4 text-3xl font-semibold text-white light:text-slate-900">
          Ready to get started?
        </h2>
        <p className="mb-6 text-lg text-slate-300 light:text-slate-600">
          Join the network and start building or contributing today.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-slate-900 transition-all hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
          >
            Sign Up Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-8 py-3 font-semibold text-white transition-all hover:bg-slate-900 light:border-slate-300 light:text-slate-900 light:hover:bg-slate-50"
          >
            Read Documentation
          </Link>
        </div>
      </motion.div>
    </PageShell>
  );
}