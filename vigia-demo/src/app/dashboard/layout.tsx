// src/app/dashboard/layout.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Map as MapIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { signOut } from "@/lib/auth";

type LinkItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** ---- Sidebar ---- */
function DashSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  const links: LinkItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { label: "Datasets", href: "/dashboard/datasets", icon: MapIcon },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 224 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={[
        "sticky top-6 self-start",
        "rounded-2xl border border-white/10",
        "bg-slate-900/80 backdrop-blur-xl",
        "shadow-[0_8px_24px_rgba(0,0,0,.22)]",
        collapsed ? "p-2" : "p-3",
        "max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar",
      ].join(" ")}
      style={{ willChange: "width" }}
    >
      {/* Collapse control */}
      <div className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-end"}`}>
        <button
          onClick={onToggle}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "group relative w-full rounded-xl outline-none",
                "transition-colors focus:ring-2 focus:ring-white/20",
                collapsed ? "px-2 py-3" : "px-2 py-2.5",
                "grid items-center gap-3",
                collapsed ? "grid-cols-[28px] justify-items-center" : "grid-cols-[28px_minmax(0,1fr)]",
                isActive ? "bg-white text-slate-900" : "text-white/80 hover:bg-white/10",
                "border border-transparent",
              ].join(" ")}
              title={collapsed ? label : undefined}
            >
              <div
                className={[
                  "h-7 w-7 grid place-items-center rounded-md",
                  isActive ? "bg-slate-900 text-slate-100" : "bg-white/10 text-white/90",
                ].join(" ")}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              {!collapsed && (
                <div className="min-w-0 text-left leading-snug">
                  <div className={`truncate text-sm font-semibold ${isActive ? "text-slate-900" : "text-white/90"}`}>
                    {label}
                  </div>
                  {!isActive && <div className="truncate text-xs text-white/55">&nbsp;</div>}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="mt-3 border-t border-white/10 pt-3">
        <form action={signOut}>
          <button
            type="submit"
            className={[
              "group relative w-full rounded-xl border border-transparent",
              "px-3 py-2.5 text-sm font-medium",
              "text-white/70 hover:text-white hover:bg-red-500/10",
              collapsed ? "grid grid-cols-[28px] justify-items-center px-2" : "flex items-center gap-3",
            ].join(" ")}
            title={collapsed ? "Sign out" : undefined}
          >
            <div className="h-7 w-7 grid place-items-center rounded-md bg-white/10 text-white/90 group-hover:text-red-400">
              <LogOut className="h-[18px] w-[18px]" />
            </div>
            {!collapsed && <span className="min-w-0 truncate">Sign out</span>}
          </button>
        </form>
      </div>
    </motion.aside>
  );
}

/** ---- Layout ---- */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  // First client render matches SSR (expanded = false → 224px)
  const [collapsed, setCollapsed] = useState(false);

  // After mount: hydrate from localStorage and subscribe to sidebar toggle events
  useEffect(() => {
    const v = localStorage.getItem("dashboard.sidebar.collapsed");
    const initial = v === "1";
    if (initial !== collapsed) setCollapsed(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("dashboard.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }, []);

  // CSS var for grid template; first paint uses 224px → matches SSR markup
  const gridCols = useMemo(
    () => ({ ["--sidebar" as any]: collapsed ? "72px" : "224px" }),
    [collapsed]
  );

  return (
    <main className="relative min-h-screen bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-grid" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-6">
        <div
          className="grid items-start gap-6 md:grid-cols-[var(--sidebar)_minmax(0,1fr)]"
          // prevents hydration warnings if something still differs
          suppressHydrationWarning
          style={gridCols}
        >
          <DashSidebar collapsed={collapsed} onToggle={handleToggle} />
          <section className="min-w-0 space-y-6">{children}</section>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}