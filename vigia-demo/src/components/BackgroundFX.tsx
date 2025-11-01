"use client";
import { motion } from "framer-motion";

export default function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: .9, x: -200, y: -120 }}
        animate={{ opacity: .35, scale: 1, x: -60, y: -40 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute h-[42rem] w-[42rem] rounded-full blur-3xl bg-cyan-400/25"
      />
      <motion.div
        initial={{ opacity: 0, scale: .9, x: 220, y: 180 }}
        animate={{ opacity: .25, scale: 1, x: 120, y: 80 }}
        transition={{ duration: 1.4, ease: "easeOut", delay: .1 }}
        className="absolute h-[36rem] w-[36rem] rounded-full blur-3xl bg-fuchsia-500/20"
      />
    </div>
  );
}