// components/MapIndiaSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useMemo } from "react";

type Tile = {
  title: string;
  slug: string; // used for href: /datasets/[slug]
  img: string;  // placeholder image path
};

const defaultTiles: Tile[] = [
  { title: "Mumbai, Maharashtra", slug: "mumbai", img: "/maps/mumbai.jpg" },
  { title: "Delhi, NCT", slug: "delhi", img: "/maps/delhi.jpg" },
  { title: "Bengaluru, Karnataka", slug: "bengaluru", img: "/maps/bengaluru.jpg" },
  { title: "Hyderabad, Telangana", slug: "hyderabad", img: "/maps/hyderabad.jpg" },
  { title: "Chennai, Tamil Nadu", slug: "chennai", img: "/maps/chennai.jpg" },
  { title: "Pune, Maharashtra", slug: "pune", img: "/maps/pune.jpg" },
  { title: "Kolkata, West Bengal", slug: "kolkata", img: "/maps/kolkata.jpg" },
  { title: "Ahmedabad, Gujarat", slug: "ahmedabad", img: "/maps/ahmedabad.jpg" },
];

const springTap = {
  whileHover: {
    y: -2,
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  whileTap: { scale: 0.98, y: 0 },
};

export default function MapIndiaSection({
  tiles = defaultTiles,
  stats = {
    totalKm: "12.4M",
    coverage: "18%",
    uniqueKm: "3.1M",
  },
}: {
  tiles?: Tile[];
  stats?: { totalKm: string; coverage: string; uniqueKm: string };
}) {
  // Duplicate tiles so marquee loops seamlessly
  const rowA = useMemo(() => [...tiles, ...tiles], [tiles]);
  const rowB = useMemo(
    () => [...tiles.slice().reverse(), ...tiles.slice().reverse()],
    [tiles],
  );

  return (
    <section className="relative py-24 lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header, aligned with Sonic sections */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-medium tracking-[0.22em] text-cyan-400 light:text-blue-600">
            COVERAGE
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl light:text-slate-900">
            Map India.{" "}
            <span className="text-cyan-400 light:text-cyan-600">Join the grid.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-slate-400 light:text-slate-600">
            VIGIA is a community-powered network for fresh Indian road intelligence—
            collected, verified, and shared in real time.
          </p>
        </div>

        {/* Main card: stats + CTAs */}
        <div className="card-glass border-slate-700/60 bg-slate-950/70 p-8 md:p-10 light:border-slate-200 light:bg-white/80">
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <motion.div {...springTap}>
              <Link
                href="/docs"
                className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
              >
                Build on VIGIA
              </Link>
            </motion.div>
            <motion.div {...springTap}>
              <Link
                href="/datasets"
                className="rounded-full border border-slate-700 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-slate-500 hover:bg-slate-900/50 light:border-slate-300 light:text-slate-900 light:hover:border-slate-400 light:hover:bg-slate-50"
              >
                Explore coverage
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-3"
          >
            <StatCard value={stats.totalKm} label="Total km mapped" />
            <StatCard value={stats.coverage} label="India road coverage" />
            <StatCard value={stats.uniqueKm} label="Unique km mapped" />
          </motion.div>
        </div>

        {/* Light connector bar */}
        <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-slate-600/50 to-transparent light:via-slate-300" />

        {/* Moving map tiles */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/70 p-6 backdrop-blur-md light:border-slate-200 light:bg-white/80">
          <div className="space-y-5">
            <MarqueeRow tiles={rowA} duration={40} direction="left" />
            <MarqueeRow tiles={rowB} duration={48} direction="right" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-5 text-left shadow-sm transition-colors hover:border-cyan-500/60 light:border-slate-200 light:bg-white"
    >
      <div className="text-2xl md:text-3xl font-semibold text-white light:text-slate-900">
        {value}
      </div>
      <div className="mt-2 text-xs md:text-sm text-slate-400 light:text-slate-600">
        {label}
      </div>
    </motion.div>
  );
}

function MarqueeRow({
  tiles,
  duration,
  direction,
}: {
  tiles: Tile[];
  duration: number;
  direction: "left" | "right";
}) {
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex w-[200%] gap-4 md:gap-6"
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        {tiles.map((t, i) => (
          <MapTile key={`${t.slug}-${i}`} tile={t} />
        ))}
      </motion.div>
    </div>
  );
}

function MapTile({ tile }: { tile: Tile }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="shrink-0"
    >
      <Link
        href={`/datasets/${tile.slug}`}
        className="group relative block h-44 w-[320px] overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900 shadow-lg backdrop-blur-md light:border-slate-200 light:bg-slate-50"
      >
        <Image
          src={tile.img}
          alt={tile.title}
          fill
          className="object-cover opacity-75 transition-all duration-500 group-hover:scale-110 group-hover:opacity-95"
          sizes="320px"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="text-sm font-semibold text-white drop-shadow-md light:text-slate-900">
            {tile.title}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-300 light:text-slate-600">
            Explore region
            <span className="ml-1 transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}