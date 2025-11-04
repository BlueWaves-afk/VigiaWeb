"use client";

import TopBar from "@/components/TopBar";

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode; // e.g., filters / refresh button row
  children: React.ReactNode;
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
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm md:text-base text-white/60 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>

        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}