"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

/* ---------- Carousel Slides (keeping your existing animations) ---------- */

function NetworkAnimation() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      
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
      
      {[[100, 80], [200, 150], [300, 100], [150, 220], [280, 240], [320, 200]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="20" fill="url(#nodeGrad)" filter="url(#glow)">
            <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </circle>
          <g transform={`translate(${cx - 10}, ${cy - 6})`}>
            <rect x="2" y="6" width="16" height="6" rx="1" fill="#0F172A" />
            <rect x="4" y="2" width="12" height="6" rx="1" fill="#0F172A" />
            <circle cx="5" cy="12" r="2" fill="#1E293B" />
            <circle cx="15" cy="12" r="2" fill="#1E293B" />
          </g>
          <circle cx={cx} cy={cy} r="30" fill="none" stroke="#60A5FA" strokeWidth="1" opacity="0">
            <animate attributeName="r" values="20;40" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
            <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
          </circle>
        </g>
      ))}
      
      <text x="200" y="280" textAnchor="middle" fill="#64748B" fontSize="12" fontFamily="monospace">
        V2V mesh • 6 nodes active
      </text>
    </svg>
  );
}

function SensorAnimation() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <g transform="translate(200, 150)">
        <rect x="-25" y="-15" width="50" height="30" rx="4" fill="#1E293B" stroke="#3B82F6" strokeWidth="2" />
        <rect x="-20" y="-12" width="15" height="10" rx="2" fill="#0F172A" />
        <rect x="5" y="-12" width="15" height="10" rx="2" fill="#0F172A" />
        
        <g>
          <path d="M0,0 L-80,-60 A100,100 0 0,1 80,-60 Z" fill="url(#radarGrad)">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
          </path>
        </g>
        
        {[-60, -30, 0, 30, 60].map((angle, i) => (
          <line key={i} x1="0" y1="0" x2={Math.sin(angle * Math.PI / 180) * 100} y2={-Math.cos(angle * Math.PI / 180) * 100} stroke="#F59E0B" strokeWidth="1" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
          </line>
        ))}
        
        <path d="M0,-15 L-40,-80 L40,-80 Z" fill="#EC4899" fillOpacity="0.15" stroke="#EC4899" strokeWidth="1" strokeDasharray="4,2">
          <animate attributeName="fill-opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
        </path>
      </g>
      
      {[[120, 90, "pedestrian"], [280, 100, "vehicle"], [150, 200, "cyclist"]].map(([x, y, label], i) => (
        <g key={i}>
          <rect x={Number(x) - 15} y={Number(y) - 15} width="30" height="30" fill="none" stroke="#10B981" strokeWidth="2" rx="4">
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </rect>
          <text x={Number(x)} y={Number(y) + 30} textAnchor="middle" fill="#10B981" fontSize="9" fontFamily="monospace">{label}</text>
        </g>
      ))}
      
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

function TokenAnimation() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="tokenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <filter id="tokenGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      
      <g transform="translate(80, 130)">
        <circle cx="0" cy="-30" r="20" fill="#334155" />
        <rect x="-20" y="-10" width="40" height="50" rx="8" fill="#334155" />
        <rect x="25" y="-5" width="20" height="35" rx="3" fill="#1E293B" stroke="#3B82F6" strokeWidth="1" />
        <rect x="27" y="0" width="16" height="25" rx="1" fill="#0F172A" />
      </g>
      
      <g transform="translate(80, 60)">
        <circle r="25" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="2">
          <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite" />
        </circle>
        <text y="5" textAnchor="middle" fill="#EF4444" fontSize="20" fontWeight="bold">!</text>
        <text y="45" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">HAZARD REPORTED</text>
      </g>
      
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
      
      <g transform="translate(300, 130)">
        <rect x="-40" y="-50" width="80" height="100" rx="8" fill="#0F172A" stroke="#3B82F6" strokeWidth="2" />
        <text y="-30" textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="monospace">WALLET</text>
        
        <rect x="-30" y="-20" width="60" height="30" rx="4" fill="#0F172A" />
        <text y="-2" textAnchor="middle" fill="#FBBF24" fontSize="14" fontFamily="monospace" fontWeight="bold">
          <tspan>+2.5 VGT</tspan>
          <animate attributeName="opacity" values="1;0.7;1" dur="0.5s" repeatCount="indefinite" />
        </text>
        
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx="0" cy={20 + i * 5} rx="15" ry="5" fill="#F59E0B" fillOpacity={1 - i * 0.2} stroke="#B45309" strokeWidth="1" />
        ))}
      </g>
      
      <path d="M130,130 Q180,100 240,130" fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="6,4">
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
      </path>
      
      <text x="200" y="280" textAnchor="middle" fill="#64748B" fontSize="11" fontFamily="monospace">
        Earn tokens for every verified hazard report
      </text>
    </svg>
  );
}

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
      
      <path d="M150,280 L100,150 L100,80 L300,80 L300,150 L250,280 Z" fill="url(#roadGrad)" stroke="#334155" strokeWidth="1" />
      
      {[100, 140, 180, 220].map((y, i) => (
        <rect key={i} x="195" y={y} width="10" height="20" fill="#FBBF24" opacity="0.8">
          <animate attributeName="y" values={`${y};${y + 30};${y}`} dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1s" repeatCount="indefinite" />
        </rect>
      ))}
      
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
      
      <g transform="translate(70, 200)">
        <rect x="-35" y="-20" width="70" height="40" rx="8" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
        {[1, 2, 3].map((i) => (
          <path key={i} d={`M20,0 Q${25 + i * 8},${-10 - i * 3} ${20 + i * 10},0 Q${25 + i * 8},${10 + i * 3} 20,0`} fill="none" stroke="#10B981" strokeWidth="1.5" opacity={1 - i * 0.25}>
            <animate attributeName="opacity" values={`${1 - i * 0.25};${0.3 - i * 0.1};${1 - i * 0.25}`} dur="1s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
          </path>
        ))}
        <circle cx="-10" cy="0" r="10" fill="#10B981" />
        <path d="M-14,-3 L-14,3 L-10,3 L-5,7 L-5,-7 L-10,-3 Z" fill="#0F172A" />
        <text x="0" y="35" textAnchor="middle" fill="#10B981" fontSize="8" fontFamily="monospace">&quot;Pothole ahead&quot;</text>
      </g>
      
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
    desc: "Share hazard data in real-time through V2V mesh networking"
  },
  { 
    id: 1, 
    title: "Multimodal Perception", 
    component: SensorAnimation, 
    desc: "Fused sensor data for comprehensive scene understanding"
  },
  { 
    id: 2, 
    title: "Token Rewards", 
    component: TokenAnimation, 
    desc: "Earn VGT tokens for contributing hazard reports"
  },
  { 
    id: 3, 
    title: "Road Intelligence", 
    component: RoadIntelAnimation, 
    desc: "AI-powered hazard detection with voice alerts"
  },
];

export default function SonicHero() {
  const containerRef = useRef<HTMLElement>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const CARD_DURATION = 5000;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => setIsInView(entries[0].isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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

  const { scrollYProgress } = useScroll({ 
    target: containerRef, 
    offset: ["start end", "end start"] 
  });
  const floatY = useTransform(scrollYProgress, [0, 1], [0, 18]);

  const scrollToCopilot = () => {
    document.getElementById("copilot-demo")?.scrollIntoView({ 
      behavior: "smooth", 
      block: "start" 
    });
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-slate-950 light:bg-white"
    >
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-32 lg:px-8 lg:py-40">
        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl"
        >
          {/* Eyebrow */}
          <p className="mb-6 text-sm font-medium tracking-wide text-cyan-400 light:text-blue-600">
            MEET VIGIA
          </p>

          {/* Main Headline - Uber-style: Large, confident, minimal */}
          <h1 className="mb-8 text-6xl font-semibold leading-[1.1] tracking-tight text-white md:text-7xl lg:text-8xl light:text-slate-900">
            Real-time road intelligence on the edge
          </h1>

          {/* Subheadline - Single clear sentence */}
          <p className="mb-12 max-w-2xl text-xl leading-relaxed text-slate-400 md:text-2xl light:text-slate-600">
            Low-latency audio understanding, hazard memory, and a generative co-pilot that speaks before trouble.
          </p>

          {/* CTA Buttons - Clear hierarchy */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={scrollToCopilot}
              className="rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl light:bg-slate-900 light:text-white light:hover:bg-slate-800"
            >
              Try for free
            </button>

            <Link
              href="/docs"
              className="rounded-full border border-slate-700 px-8 py-4 text-base font-semibold text-white transition-all hover:border-slate-600 hover:bg-slate-900/50 light:border-slate-300 light:text-slate-900 light:hover:border-slate-400 light:hover:bg-slate-50"
            >
              Contact sales
            </Link>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="h-32" />

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          style={{ y: floatY }}
          className="mt-24"
        >
          {/* Section Header */}
          <div className="mb-12">
            <p className="mb-4 text-sm font-medium tracking-wide text-cyan-400 light:text-blue-600">
              REAL-TIME ROAD INTELLIGENCE
            </p>
            <h2 className="mb-6 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-5xl light:text-slate-900">
              Start from anywhere. We&apos;ll meet you there
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-400 light:text-slate-600">
              Bring your own sensors, start with a template, or even a prompt. 
              VIGIA meets you where you are and gets you live fast.
            </p>
          </div>

          {/* Carousel Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CAROUSEL_SLIDES.map((slide, index) => {
              const isActive = activeCard === index;
              const Component = slide.component;
              
              return (
                <button
                  key={slide.id}
                  onClick={() => {
                    setActiveCard(index);
                    setProgress(0);
                  }}
                  className={`group relative overflow-hidden rounded-2xl border bg-slate-900 p-6 text-left transition-all hover:border-slate-700 light:bg-white ${
                    isActive 
                      ? "border-cyan-500 light:border-blue-500" 
                      : "border-slate-800 light:border-slate-200"
                  }`}
                >
                  {/* Animation */}
                  <div className="mb-6 aspect-[4/3] overflow-hidden rounded-lg bg-slate-950 light:bg-slate-50">
                    <Component />
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-semibold text-white light:text-slate-900">
                    {slide.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 text-sm leading-relaxed text-slate-400 light:text-slate-600">
                    {slide.desc}
                  </p>

                  {/* Progress Bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800 light:bg-slate-200">
                    <motion.div
                      className="h-full bg-cyan-500 light:bg-blue-600"
                      initial={false}
                      animate={{ width: isActive ? `${progress}%` : "0%" }}
                      transition={{ type: "tween", duration: 0.1, ease: "linear" }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}