// components/MapIndiaSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useMemo } from "react";

type Tile = {
  title: string;
  slug: string;     // used for href: /datasets/[slug]
  img: string;      // placeholder image path
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
      damping: 25
    }
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
  const rowB = useMemo(() => [...tiles.slice().reverse(), ...tiles.slice().reverse()], [tiles]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0B1120] light:bg-white">
      {/* Fine grid background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-30 light:opacity-20">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(56,189,248,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,.06)_1px,transparent_1px)] bg-[size:4px_4px] light:bg-[linear-gradient(to_right,rgba(14,165,233,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,.08)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Main intro card */}
        <div className="border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-12 backdrop-blur-sm light:border-slate-200 light:from-white/40 light:to-slate-50/40">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="text-center"
          >
            <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl light:text-slate-900">
              Map India.
              <br className="hidden md:block" />{" "}
              <span className="text-cyan-400 light:text-cyan-600">
                Join The Grid.
              </span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: 0.08, duration: 0.6, ease: "easeOut" as const }}
            className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-300 light:text-slate-600"
          >
            VIGIA is a community-powered network for fresh Indian road intelligence—collected, verified,
            and shared in real time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: 0.16, duration: 0.5 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <motion.div {...springTap}>
              <Link
                href="/docs"
                className="rounded-full border border-slate-600 bg-white px-8 py-3.5 font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 light:border-slate-300 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
              >
                Build on VIGIA
              </Link>
            </motion.div>
            <motion.div {...springTap}>
              <Link
                href="/datasets"
                className="rounded-full border border-slate-700 bg-slate-900/50 px-8 py-3.5 font-semibold text-white transition-all hover:border-slate-600 hover:bg-slate-800/50 light:border-slate-300 light:bg-white light:text-slate-900 light:hover:border-slate-400 light:hover:bg-slate-50"
              >
                Explore Coverage
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: 0.22, duration: 0.5, staggerChildren: 0.1 }}
            className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3"
          >
            <StatCard value={stats.totalKm} label="Total KM Mapped" delay={0} />
            <StatCard value={stats.coverage} label="India Road Coverage" delay={0.1} />
            <StatCard value={stats.uniqueKm} label="Unique KM Mapped" delay={0.2} />
          </motion.div>
        </div>

        {/* Grid connector between sections - full width */}
        <div className="relative h-20 w-full overflow-hidden border-x border-slate-700/60 bg-[#0B1120] light:border-slate-200 light:bg-white">
          <div className="absolute inset-0 flex items-center justify-between">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="h-full w-px bg-slate-800/40 light:bg-slate-200/60"
              />
            ))}
          </div>
        </div>

        {/* Moving map tiles */}
        <div className="-mt-px overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-8 backdrop-blur-sm light:border-slate-200 light:from-white/40 light:to-slate-50/40">
          <div className="space-y-6">
            <MarqueeRow tiles={rowA} duration={40} direction="left" />
            <MarqueeRow tiles={rowB} duration={48} direction="right" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" as const }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-6 backdrop-blur-sm transition-all hover:border-slate-600/80 light:border-slate-200 light:from-white/40 light:to-slate-50/40 light:hover:border-slate-300"
    >
      <div className="text-4xl font-semibold text-white transition-colors group-hover:text-cyan-300 light:text-slate-900 light:group-hover:text-cyan-600">
        {value}
      </div>
      <div className="mt-2 text-sm text-slate-300 transition-colors group-hover:text-slate-200 light:text-slate-600 light:group-hover:text-slate-700">
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
        className="flex w-[200%] gap-6"
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        whileHover={{ animationPlayState: "paused" }}
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
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="shrink-0"
    >
      <Link
        href={`/datasets/${tile.slug}`}
        className="group relative block h-52 w-[440px] overflow-hidden border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 shadow-xl backdrop-blur-sm light:border-slate-200 light:from-white/40 light:to-slate-50/40"
      >
        {/* Background Image */}
        <Image
          src={tile.img}
          alt={tile.title}
          fill
          className="object-cover opacity-70 transition-all duration-500 group-hover:scale-110 group-hover:opacity-90"
          sizes="440px"
          priority={false}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Title */}
        <div className="absolute inset-x-0 top-0 p-6">
          <div className="text-xl font-semibold text-white drop-shadow-lg light:text-slate-900">{tile.title}</div>
        </div>

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="rounded-full border border-slate-600 bg-white px-8 py-3.5 font-semibold text-slate-900 shadow-2xl backdrop-blur-lg light:border-slate-300 light:bg-slate-900 light:text-white"
          >
            Explore Region →
          </motion.span>
        </div>


      </Link>
    </motion.div>
  );
}