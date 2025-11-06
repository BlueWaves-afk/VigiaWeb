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
  { title: "Mumbai, Maharashtra",    slug: "mumbai",    img: "/maps/mumbai.jpg" },
  { title: "Delhi, NCT",             slug: "delhi",     img: "/maps/delhi.jpg" },
  { title: "Bengaluru, Karnataka",   slug: "bengaluru", img: "/maps/bengaluru.jpg" },
  { title: "Hyderabad, Telangana",   slug: "hyderabad", img: "/maps/hyderabad.jpg" },
  { title: "Chennai, Tamil Nadu",    slug: "chennai",    img: "/maps/chennai.jpg" },
  { title: "Pune, Maharashtra",      slug: "pune",      img: "/maps/pune.jpg" },
  { title: "Kolkata, West Bengal",   slug: "kolkata",   img: "/maps/kolkata.jpg" },
  { title: "Ahmedabad, Gujarat",     slug: "ahmedabad", img: "/maps/ahmedabad.jpg" },
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
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[.28] [mask-image:radial-gradient(60%_60%_at_50%_40%,#000_60%,transparent_100%)]">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(148,163,184,.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center"
        >
          <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Map India.
            <br className="hidden md:block" />{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-fuchsia-400 bg-clip-text text-transparent">
              Join The Grid.
            </span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.08, duration: 0.6, ease: "easeOut" as const }}
          className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-300"
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
              className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl"
            >
              Build on VIGIA
            </Link>
          </motion.div>
          <motion.div {...springTap}>
            <Link
              href="/datasets"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white/90 backdrop-blur-lg transition-all hover:bg-white/10 hover:border-white/25"
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

        {/* Moving map tiles */}
        <div className="mt-16 space-y-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
          <MarqueeRow tiles={rowA} duration={40} direction="left" />
          <MarqueeRow tiles={rowB} duration={48} direction="right" />
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
      className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/70 p-6 backdrop-blur-lg transition-all hover:border-white/20"
    >
      <div className="text-4xl font-semibold text-white transition-colors group-hover:text-cyan-300">
        {value}
      </div>
      <div className="mt-2 text-sm text-slate-300 transition-colors group-hover:text-slate-200">
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
        className="group relative block h-52 w-[440px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/80 shadow-xl backdrop-blur-lg"
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
          <div className="text-xl font-semibold text-white drop-shadow-lg">{tile.title}</div>
        </div>
        
        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-white/90 px-6 py-3 font-semibold text-slate-900 shadow-2xl backdrop-blur-lg"
          >
            Explore Region →
          </motion.span>
        </div>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      </Link>
    </motion.div>
  );
}