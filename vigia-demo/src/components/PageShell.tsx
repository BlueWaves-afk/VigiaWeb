"use client";

import TopBar from "@/components/TopBar";
import { motion } from "framer-motion";

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
  bannerSrc,
  breadcrumbs,
  heroBadge,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode; // e.g., filters / refresh button row
  children: React.ReactNode;
  bannerSrc?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  heroBadge?: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen bg-slate-950 text-white">
      {/* Soft gradient + faint grid, same as homepage */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(56,189,248,.15),transparent),radial-gradient(900px_500px_at_90%_10%,rgba(168,85,247,.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(#0b1220_0,#0b1220_1px,transparent_1px),linear-gradient(90deg,#0b1220_0,#0b1220_1px,transparent_1px)] bg-[size:48px_48px]" style={{maskImage:"linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,.05))"}}/>
      </div>

      {/* Sticky nav from your site */}
      <TopBar />

      {/* Content container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-28"
      >
        {bannerSrc && (
          <div className="mb-6 w-full">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
              <img
                src={bannerSrc}
                alt="banner"
                className="h-48 w-full object-cover sm:h-60 md:h-72"
              />
            </div>
          </div>
        )}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4 text-xs text-white/60 sm:text-sm" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
              {breadcrumbs.map(({ label, href }, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={`${label}-${index}`} className="flex items-center gap-1">
                    {href && !isLast ? (
                      <a
                        href={href}
                        className="rounded-md bg-white/5 px-2 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="px-2 py-1 text-white/50">{label}</span>
                    )}
                    {!isLast && <span className="text-white/40">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            {heroBadge && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-cyan-300/80">
                {heroBadge}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions ? (
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
              {actions}
            </div>
          ) : null}
        </header>

        <div className="mt-8 space-y-6 sm:space-y-8">{children}</div>
      </motion.div>
    </main>
  );
}