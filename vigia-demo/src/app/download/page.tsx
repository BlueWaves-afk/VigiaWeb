"use client";

import PageShell from "@/components/PageShell";
import { motion } from "framer-motion";
import {
  ArrowDown,
  Cpu,
  Smartphone,
  Globe,
  ArrowRight,
  X,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: "easeOut" as const },
});

/* ---------------- Small UI bits ---------------- */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
      {children}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs text-slate-500">
      <span>{label}</span>
      <span className="text-slate-400">{value}</span>
    </div>
  );
}

/* ---------------- Hardware Modal ---------------- */

function HardwareModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Edge Node Requirements
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-3 text-sm text-slate-400">
          <li>• NVIDIA Jetson Orin / Xavier / Nano</li>
          <li>• ARM64 Linux (Ubuntu 20.04+)</li>
          <li>• 4GB RAM minimum (8GB recommended)</li>
          <li>• Camera input (USB / CSI)</li>
          <li>• Intermittent connectivity supported</li>
        </ul>

        <p className="mt-4 text-xs text-slate-500">
          Final hardware certification varies by deployment and SLA tier.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Download Card ---------------- */

function DownloadCard({
  title,
  description,
  badges,
  version,
  checksum,
  icon,
  cta,
  disabled = false,
  delay = 0,
  footer,
}: {
  title: string;
  description: string;
  badges: string[];
  version: string;
  checksum: string;
  icon: React.ReactNode;
  cta: string;
  disabled?: boolean;
  delay?: number;
  footer?: React.ReactNode;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      whileHover={!disabled ? { y: -4 } : undefined}
      className={`relative rounded-2xl border p-8 ${
        disabled
          ? "border-slate-800 bg-slate-900/50 opacity-60"
          : "border-slate-800 bg-slate-900 hover:border-slate-700"
      }`}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      <p className="mb-6 text-sm text-slate-400">{description}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {badges.map((b) => (
          <Badge key={b}>{b}</Badge>
        ))}
      </div>

      <div className="mb-6 space-y-1">
        <MetaRow label="Version" value={version} />
        <MetaRow label="SHA-256" value={checksum} />
      </div>

      <button
        disabled={disabled}
        className={`mb-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold ${
          disabled
            ? "cursor-not-allowed border border-slate-700 text-slate-500"
            : "bg-white text-slate-900 hover:bg-slate-100"
        }`}
      >
        <ArrowDown className="h-4 w-4" />
        {cta}
      </button>

      {footer}

      {disabled && (
        <div className="absolute right-6 top-6 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
          Coming soon
        </div>
      )}
    </motion.div>
  );
}

/* ---------------- Page ---------------- */

export default function DownloadPage() {
  const [showHardware, setShowHardware] = useState(false);

  return (
    <PageShell
      title="Download"
      subtitle="Install VIGIA across mobile, edge, or browser environments. Built for reliability, privacy, and real-world infrastructure intelligence."
    >
      {/* Hero */}
      <motion.div {...fadeUp(0)} className="mb-16 text-center">
        <h1 className="mb-6 text-5xl font-semibold text-white md:text-6xl">
          Download VIGIA
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400">
          Capture, validate, and consume road hazard intelligence — from
          smartphones to dedicated edge hardware.
        </p>
      </motion.div>

      {/* Downloads */}
      <div className="mb-20 grid gap-8 md:grid-cols-3">
        <DownloadCard
          title="Mobile App"
          description="Capture road hazards on the move using your phone."
          badges={["iOS", "Android", "Crowd-sourced"]}
          version="v0.9.2"
          checksum="a91f…c3e2"
          icon={<Smartphone className="h-5 w-5" />}
          cta="Download App"
          delay={0.1}
          footer={
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
              <QrCode className="h-4 w-4" />
              Scan QR to install on mobile
            </div>
          }
        />

        <DownloadCard
          title="Edge Node Firmware"
          description="Run VIGIA continuously on dashcams and roadside hardware."
          badges={["Jetson", "ARM64", "Offline-first"]}
          version="v1.0.0-rc"
          checksum="b72c…91ad"
          icon={<Cpu className="h-5 w-5" />}
          cta="Request Access"
          disabled
          delay={0.15}
          footer={
            <button
              onClick={() => setShowHardware(true)}
              className="text-xs text-cyan-400 hover:underline"
            >
              View hardware requirements
            </button>
          }
        />

        <DownloadCard
          title="Web Sandbox"
          description="Explore live hazard streams directly in the browser."
          badges={["WebGPU", "ONNX", "Read-only"]}
          version="v0.8.7"
          checksum="f18e…0d4b"
          icon={<Globe className="h-5 w-5" />}
          cta="Open Sandbox"
          delay={0.2}
        />
      </div>

      {/* Funnel CTA */}
      <motion.div
        {...fadeUp(0.4)}
        className="rounded-2xl border border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-10 text-center"
      >
        <h2 className="mb-4 text-3xl font-semibold text-white">
          Ready to go beyond the demo?
        </h2>
        <p className="mb-6 text-lg text-slate-300">
          Choose a plan, access verified data, and unlock the full dashboard.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-slate-900 hover:bg-slate-100"
          >
            View Pricing
            <ArrowRight className="h-5 w-5" />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-8 py-3 font-semibold text-white hover:bg-slate-900"
          >
            Open Dashboard
          </Link>
        </div>
      </motion.div>

      {showHardware && <HardwareModal onClose={() => setShowHardware(false)} />}
    </PageShell>
  );
}

