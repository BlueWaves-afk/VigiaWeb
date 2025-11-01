// src/components/TopBar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/copilot", label: "Copilot" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export default function TopBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/50">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-400/20 text-cyan-300">V</div>
          <span className="font-semibold text-white">VIGIA</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition-colors ${pathname===l.href ? "text-white" : "text-white/70 hover:text-white"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/start" className="ml-1 inline-flex items-center rounded-md bg-white px-3 py-1.5 text-slate-900 font-medium hover:bg-white/90">
            Start
          </Link>
        </nav>
      </div>
    </header>
  );
}