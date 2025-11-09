// src/components/DocsTOC.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Section = { id: string; title: string };

export default function DocsTOC({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  const [open, setOpen] = useState(false); // mobile drawer
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Attach an IntersectionObserver to all section targets
  useEffect(() => {
    const opts: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px -60% 0px", // fire when heading is in top 40%
      threshold: 0,
    };
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const id = e.target.getAttribute("id") || "";
          if (id) setActive(id);
        }
      }
    }, opts);
    observerRef.current = obs;

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, [sections]);

  // Smooth scroll
  function goto(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    setOpen(false);
    // offset for your TopBar height (~80–96px)
    const offset = 88;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const items = useMemo(
    () =>
      sections.map((s) => (
        <button
          key={s.id}
          onClick={() => goto(s.id)}
          className={`w-full text-left rounded-lg px-3 py-2 transition ${
            active === s.id
              ? "bg-white text-slate-900"
              : "text-white/80 hover:bg-white/10"
          }`}
        >
          {s.title}
        </button>
      )),
    [sections, active]
  );

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-full max-w-[260px] shrink-0 lg:block">
        <div className="card-glass h-full overflow-auto no-scrollbar p-3">
          <div className="mb-2 px-2 text-xs uppercase tracking-wider text-white/50">
            On this page
          </div>
          <nav className="flex flex-col gap-1">{items}</nav>
          <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/50">
            <p className="m-0">
              Tip: headings highlight as you scroll. Click any item to smooth-scroll.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile: collapsible at the top of content */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          aria-expanded={open}
        >
          {open ? "Hide contents" : "Show contents"}
        </button>
        {open && (
          <div className="card-glass mb-4 p-3">
            <nav className="flex flex-col gap-1">{items}</nav>
          </div>
        )}
      </div>
    </>
  );
}