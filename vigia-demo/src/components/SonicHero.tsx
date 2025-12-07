"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

/* ---------- Carousel Slide Animations ---------- */

/** Connected Vehicle Network Animation */
function NetworkAnimation() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      
      {/* Network connections with animated pulses */}
      {[[100, 80, 200, 150], [200, 150, 300, 100], [200, 150, 150, 220], [300, 100, 320, 200], [150, 220, 280, 240]].map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1" />
          <circle r="4" fill="#60A5FA" filter="url(#glow)">
            <animateMotion dur={`${2 + i * 0.5}s`} repeatCount="indefinite">
              <mpath href={`#path${i}`} />
            </animateMotion>
          </circle>
          <path id={`path${i}`} d={`M${x1},${y1} L${x2},${y2}`} fill="none" />
        </g>
      ))}
      
      {/* Vehicle nodes */}
      {[[100, 80], [200, 150], [300, 100], [150, 220], [280, 240], [320, 200]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="20" fill="url(#nodeGrad)" filter="url(#glow)">
            <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </circle>
          {/* Car icon */}
          <g transform={`translate(${cx - 10}, ${cy - 6})`}>
            <rect x="2" y="6" width="16" height="6" rx="1" fill="#0F172A" />
            <rect x="4" y="2" width="12" height="6" rx="1" fill="#0F172A" />
            <circle cx="5" cy="12" r="2" fill="#1E293B" />
            <circle cx="15" cy="12" r="2" fill="#1E293B" />
          </g>
          {/* Signal waves */}
          <circle cx={cx} cy={cy} r="30" fill="none" stroke="#60A5FA" strokeWidth="1" opacity="0">
            <animate attributeName="r" values="20;40" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
            <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
          </circle>
        </g>
      ))}
      
      {/* Data flow label */}
      <text x="200" y="280" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="monospace">
        V2V mesh • 6 nodes active
      </text>
    </svg>
  );
}

/** Multimodal Sensor Perception Animation */
function SensorAnimation() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lidarGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      
      {/* Central vehicle */}
      <g transform="translate(200, 150)">
        <rect x="-25" y="-15" width="50" height="30" rx="4" fill="#1E293B" stroke="#3B82F6" strokeWidth="2" />
        <rect x="-20" y="-12" width="15" height="10" rx="2" fill="#0F172A" />
        <rect x="5" y="-12" width="15" height="10" rx="2" fill="#0F172A" />
        
        {/* Radar sweep */}
        <g>
          <path d="M0,0 L-80,-60 A100,100 0 0,1 80,-60 Z" fill="url(#radarGrad)">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
          </path>
        </g>
        
        {/* LiDAR scan lines */}
        {[-60, -30, 0, 30, 60].map((angle, i) => (
          <line key={i} x1="0" y1="0" x2={Math.sin(angle * Math.PI / 180) * 100} y2={-Math.cos(angle * Math.PI / 180) * 100} stroke="#F59E0B" strokeWidth="1" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
          </line>
        ))}
        
        {/* Camera FOV */}
        <path d="M0,-15 L-40,-80 L40,-80 Z" fill="#EC4899" fillOpacity="0.15" stroke="#EC4899" strokeWidth="1" strokeDasharray="4,2">
          <animate attributeName="fill-opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
        </path>
      </g>
      
      {/* Detected objects */}
      {[[120, 90, "pedestrian"], [280, 100, "vehicle"], [150, 200, "cyclist"]].map(([x, y, label], i) => (
        <g key={i}>
          <rect x={Number(x) - 15} y={Number(y) - 15} width="30" height="30" fill="none" stroke="#10B981" strokeWidth="2" rx="4">
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </rect>
          <text x={Number(x)} y={Number(y) + 30} textAnchor="middle" fill="#10B981" fontSize="9" fontFamily="monospace">{label}</text>
        </g>
      ))}
      
      {/* Sensor fusion indicator */}
      <g transform="translate(330, 250)">
        <rect x="-50" y="-20" width="100" height="40" rx="4" fill="#0F172A" stroke="#334155" />
        <text x="0" y="-5" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">SENSOR FUSION</text>
        <text x="0" y="10" textAnchor="middle" fill="#10B981" fontSize="11" fontFamily="monospace" fontWeight="bold">
          <tspan>ACTIVE</tspan>
          <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
        </text>
      </g>
    </svg>
  );
}

/** Token Rewards Animation */
function TokenAnimation() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="tokenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="walletGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <filter id="tokenGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      
      {/* Driver with phone */}
      <g transform="translate(80, 130)">
        {/* Person silhouette */}
        <circle cx="0" cy="-30" r="20" fill="#334155" />
        <rect x="-20" y="-10" width="40" height="50" rx="8" fill="#334155" />
        {/* Phone */}
        <rect x="25" y="-5" width="20" height="35" rx="3" fill="#1E293B" stroke="#3B82F6" strokeWidth="1" />
        <rect x="27" y="0" width="16" height="25" rx="1" fill="#0F172A" />
      </g>
      
      {/* Hazard report indicator */}
      <g transform="translate(80, 60)">
        <circle r="25" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="2">
          <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite" />
        </circle>
        <text y="5" textAnchor="middle" fill="#EF4444" fontSize="20" fontWeight="bold">!</text>
        <text y="45" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">HAZARD REPORTED</text>
      </g>
      
      {/* Flying tokens */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle r="12" fill="url(#tokenGrad)" filter="url(#tokenGlow)">
            <animateMotion dur="2s" repeatCount="indefinite" begin={`${i * 0.6}s`}>
              <mpath href="#tokenPath" />
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" begin={`${i * 0.6}s`} />
          </circle>
          <text fontSize="10" fontWeight="bold" fill="#0F172A" textAnchor="middle" dy="4">
            <animateMotion dur="2s" repeatCount="indefinite" begin={`${i * 0.6}s`}>
              <mpath href="#tokenPath" />
            </animateMotion>
            V
          </text>
        </g>
      ))}
      <path id="tokenPath" d="M120,80 Q200,50 280,120" fill="none" />
      
      {/* Wallet */}
      <g transform="translate(300, 130)">
        <rect x="-40" y="-50" width="80" height="100" rx="8" fill="url(#walletGrad)" stroke="#3B82F6" strokeWidth="2" />
        <text y="-30" textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="monospace">WALLET</text>
        
        {/* Balance display */}
        <rect x="-30" y="-20" width="60" height="30" rx="4" fill="#0F172A" />
        <text y="-2" textAnchor="middle" fill="#FBBF24" fontSize="14" fontFamily="monospace" fontWeight="bold">
          <tspan>+2.5 VGT</tspan>
          <animate attributeName="opacity" values="1;0.7;1" dur="0.5s" repeatCount="indefinite" />
        </text>
        
        {/* Token stack */}
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx="0" cy={20 + i * 5} rx="15" ry="5" fill="#F59E0B" fillOpacity={1 - i * 0.2} stroke="#B45309" strokeWidth="1" />
        ))}
      </g>
      
      {/* Connection arrow */}
      <path d="M130,130 Q180,100 240,130" fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="6,4">
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
      </path>
      
      {/* Stats */}
      <text x="200" y="280" textAnchor="middle" fill="#64748B" fontSize="11" fontFamily="monospace">
        Earn tokens for every verified hazard report
      </text>
    </svg>
  );
}

/** Road Intelligence Animation */
function RoadIntelAnimation() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="alertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      
      {/* Road perspective */}
      <path d="M150,280 L100,150 L100,80 L300,80 L300,150 L250,280 Z" fill="url(#roadGrad)" stroke="#334155" strokeWidth="1" />
      
      {/* Lane markings */}
      {[100, 140, 180, 220].map((y, i) => (
        <rect key={i} x="195" y={y} width="10" height="20" fill="#FBBF24" opacity="0.8">
          <animate attributeName="y" values={`${y};${y + 30};${y}`} dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1s" repeatCount="indefinite" />
        </rect>
      ))}
      
      {/* Hazard markers on road */}
      <g transform="translate(170, 120)">
        <polygon points="0,-15 13,10 -13,10" fill="url(#alertGrad)" stroke="#FCA5A5" strokeWidth="1">
          <animate attributeName="opacity" values="1;0.6;1" dur="0.8s" repeatCount="indefinite" />
        </polygon>
        <text y="3" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">!</text>
        <text y="30" textAnchor="middle" fill="#EF4444" fontSize="8" fontFamily="monospace">POTHOLE</text>
      </g>
      
      <g transform="translate(230, 160)">
        <polygon points="0,-12 10,8 -10,8" fill="#F59E0B" stroke="#FCD34D" strokeWidth="1">
          <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" begin="0.3s" />
        </polygon>
        <text y="2" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
        <text y="22" textAnchor="middle" fill="#F59E0B" fontSize="8" fontFamily="monospace">DEBRIS</text>
      </g>
      
      {/* AI Processing indicator */}
      <g transform="translate(330, 60)">
        <rect x="-45" y="-25" width="90" height="50" rx="6" fill="#0F172A" stroke="#3B82F6" strokeWidth="1" />
        <text y="-8" textAnchor="middle" fill="#3B82F6" fontSize="10" fontFamily="monospace">AI ANALYSIS</text>
        <g transform="translate(-25, 8)">
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={i * 12} y="0" width="8" height="12" fill="#3B82F6" rx="1">
              <animate attributeName="height" values="4;12;4" dur="0.8s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
              <animate attributeName="y" values="8;0;8" dur="0.8s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
            </rect>
          ))}
        </g>
      </g>
      
      {/* Voice alert */}
      <g transform="translate(70, 200)">
        <rect x="-35" y="-20" width="70" height="40" rx="8" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
        {/* Sound waves */}
        {[1, 2, 3].map((i) => (
          <path key={i} d={`M20,0 Q${25 + i * 8},${-10 - i * 3} ${20 + i * 10},0 Q${25 + i * 8},${10 + i * 3} 20,0`} fill="none" stroke="#10B981" strokeWidth="1.5" opacity={1 - i * 0.25}>
            <animate attributeName="opacity" values={`${1 - i * 0.25};${0.3 - i * 0.1};${1 - i * 0.25}`} dur="1s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
          </path>
        ))}
        <circle cx="-10" cy="0" r="10" fill="#10B981" />
        <path d="M-14,-3 L-14,3 L-10,3 L-5,7 L-5,-7 L-10,-3 Z" fill="#0F172A" />
        <text x="0" y="35" textAnchor="middle" fill="#10B981" fontSize="8" fontFamily="monospace">&quot;Pothole ahead&quot;</text>
      </g>
      
      {/* Stats bar */}
      <g transform="translate(200, 280)">
        <text textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="monospace">
          Real-time hazard detection • Voice alerts • Edge AI
        </text>
      </g>
    </svg>
  );
}

const CAROUSEL_SLIDES = [
  { 
    id: 0, 
    title: "Connected Vehicle Network", 
    component: NetworkAnimation, 
    subtitle: "Share hazard data in real-time through V2V mesh networking.",
    shortDesc: "V2V mesh networking for real-time hazard sharing.",
    desc: "Connect your fleet to our decentralized network. Every vehicle becomes a sensor, sharing road conditions and hazards instantly with nearby drivers."
  },
  { 
    id: 1, 
    title: "Multimodal Perception", 
    component: SensorAnimation, 
    subtitle: "Fused sensor data for comprehensive scene understanding.",
    shortDesc: "Camera, radar, and audio fusion.",
    desc: "Combine camera, radar, LiDAR, and audio inputs for 360° awareness. Our edge AI processes multiple streams simultaneously."
  },
  { 
    id: 2, 
    title: "Token Rewards", 
    component: TokenAnimation, 
    subtitle: "Earn VGT tokens for contributing hazard reports.",
    shortDesc: "Get rewarded for safety contributions.",
    desc: "Every verified hazard report earns you VGT tokens. Build your reputation and unlock premium features through active participation."
  },
  { 
    id: 3, 
    title: "Road Intelligence", 
    component: RoadIntelAnimation, 
    subtitle: "AI-powered hazard detection with voice alerts.",
    shortDesc: "Proactive voice alerts before trouble.",
    desc: "Our generative co-pilot speaks before you reach hazards. Context-aware alerts adapt to speed, weather, and road conditions."
  },
];

/* ---------- Motion helpers ---------- */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14, filter: "blur(2px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
      delay
    }
  },
});

const springTap = {
  whileHover: {
    y: -2,
    scale: 1.015,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  },
  whileTap: { scale: 0.985, y: 0 },
};

export default function SonicHero() {
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const CARD_DURATION = 5000; // 5 seconds per card

  // Observe section visibility
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(entries[0].isIntersecting);
      },
      { threshold: 0.3 } // Carousel active when 30% of section is visible
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance cards with progress - only when in view
  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveCard((current) => (current + 1) % CAROUSEL_SLIDES.length);
          return 0;
        }
        return prev + (100 / (CARD_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isInView]);

  const handleCardClick = (index: number) => {
    setActiveCard(index);
    setProgress(0);
  };

  // Subtle parallax float for the right card as the user scrolls
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const floatY = useTransform(scrollYProgress, [0, 1], [0, 18]);
  const scrollToCopilot = () => {
    const target = document.getElementById("copilot-demo");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToBenchmark = () => {
    const target = document.getElementById("benchmark-demo");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-[#0B1120] light:bg-white"
    >
      {/* Fine grid background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-30 light:opacity-20">
        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(56,189,248,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,.06)_1px,transparent_1px)] bg-[size:4px_4px] light:bg-[linear-gradient(to_right,rgba(14,165,233,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,.08)_1px,transparent_1px)]" />
      </div>


      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Main content card */}
        <motion.div
          {...fadeUp(0)}
          className="border border-slate-700/60 bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-12 backdrop-blur-sm light:border-slate-200 light:from-white/40 light:to-slate-50/40"
        >
          {/* Eyebrow */}
          <div className="mb-6">
            <span className="inline-block text-sm font-semibold uppercase tracking-wider text-slate-400 light:text-slate-600">
              MEET VIGIA{" "}
              <span className="text-emerald-400 light:text-emerald-600">FOR ROAD SAFETY</span>
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="text-5xl font-normal leading-tight tracking-tight text-white md:text-7xl lg:text-8xl light:text-slate-900"
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
          >
            Real-time Road Intelligence{" "}
            <span className="block md:inline">
              on the edge
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl light:text-slate-600"
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
          >
            Low-latency audio understanding, hazard memory, and a generative co-pilot that speaks before trouble.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <motion.button
              {...springTap}
              type="button"
              onClick={scrollToCopilot}
              className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
            >
              Try for free
            </motion.button>

            <motion.div {...springTap}>
              <Link
                href="/docs"
                className="inline-block rounded-full border border-slate-700 bg-slate-900/50 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-slate-600 hover:bg-slate-800/50 light:border-slate-300 light:bg-slate-100/50 light:text-slate-900 light:hover:border-slate-400 light:hover:bg-slate-200/50"
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Grid connector between sections - full width */}
        <div className="relative h-20 w-full overflow-hidden border-x border-slate-700/60 bg-[#0B1120] light:bg-white light:border-slate-200">
          <div className="absolute inset-0 flex items-center justify-between">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="h-full w-px bg-slate-800/40 light:bg-slate-200/60"
              />
            ))}
          </div>
        </div>

        {/* Road Intelligence Section - Redesigned */}
        <motion.div
          style={{ y: floatY }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" as const }}
          ref={previewRef}
          className="-mt-4 relative overflow-hidden border border-slate-700/60 bg-[#0B1120] light:bg-white light:border-slate-200"
        >
          {/* Top section - Two column layout */}
          <div className="px-12 py-16">
            {/* Eyebrow */}
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-400 light:text-blue-600">
              REAL-TIME ROAD INTELLIGENCE
            </p>

            <div className="grid gap-12 md:grid-cols-2">
              {/* Left - Main headline */}
              <div>
                <h2 className="text-4xl font-normal leading-tight text-white md:text-5xl lg:text-6xl light:text-slate-900">
                  Start from anywhere.
                  <br />
                  We&apos;ll meet you there
                </h2>
              </div>

              {/* Right - Description and CTA */}
              <div className="flex flex-col justify-center">
                <p className="text-lg leading-relaxed text-slate-400 light:text-slate-600">
                  Bring your own sensors, start with a template, or even a prompt. 
                  VIGIA meets you where you are and gets you live fast. All roads 
                  lead to edge-native safety that&apos;s built for the real world.
                </p>
                <div className="mt-8">
                  <motion.button
                    {...springTap}
                    type="button"
                    onClick={scrollToCopilot}
                    className="rounded-full border border-slate-600 bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 light:border-slate-300 light:bg-slate-900 light:text-white light:hover:bg-slate-800"
                    style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}
                  >
                    Get started
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Accordion Carousel - Edge to edge */}
          <div className="flex gap-1">
            {CAROUSEL_SLIDES.map((slide, index) => {
              const isActive = activeCard === index;
              
              return (
                <motion.div
                  key={slide.id}
                  onClick={() => handleCardClick(index)}
                  animate={{
                    flex: isActive ? 2.5 : 1,
                  }}
                  transition={{
                    type: "tween",
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  className="group relative flex cursor-pointer flex-col bg-[#0B1120] light:bg-white"
                >
                  {/* Image area - fixed height */}
                  <div className="relative h-[400px] overflow-hidden">
                    <img 
                      src="/images/azure_demo.png" 
                      alt={slide.title}
                      className="h-full w-full object-cover"
                    />
                    {/* Slight darkening overlay for non-active */}
                    <motion.div 
                      className="absolute inset-0 bg-black/30 light:bg-white/30"
                      animate={{ opacity: isActive ? 0 : 1 }}
                      transition={{ duration: 0.3, ease: "linear" }}
                    />
                  </div>
                  
                  {/* Content footer - uniform alignment */}
                  <div className="flex flex-col bg-[#0B1120] p-6 light:bg-white">
                    {/* Title - always same size and position */}
                    <h4 className="text-base font-semibold text-white light:text-slate-900">
                      {slide.title}
                    </h4>
                    
                    {/* Progress bar - base line always visible, cyan progress on active */}
                    <div className="mt-4 h-px w-full bg-slate-700 light:bg-slate-300">
                      <motion.div
                        className="h-full bg-cyan-500 light:bg-blue-600"
                        initial={false}
                        animate={{ width: isActive ? `${progress}%` : '0%' }}
                        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
                      />
                    </div>
                    
                    {/* Description area - uniform height */}
                    <div className="mt-4 min-h-[140px]">
                      <p className="text-sm leading-relaxed text-slate-400 light:text-slate-600">
                        {isActive ? slide.subtitle : slide.shortDesc}
                      </p>
                      
                      {/* Extended description only for active */}
                      {isActive && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-500 light:text-slate-500">
                          {slide.desc}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}