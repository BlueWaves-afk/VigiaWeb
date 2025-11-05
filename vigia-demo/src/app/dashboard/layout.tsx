// src/app/dashboard/layout.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { signOut } from "@/lib/auth";

type LinkItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function DashSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // persist collapsed state
  useEffect(() => {
    const v = localStorage.getItem("dashboard.sidebar.collapsed");
    if (v === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("dashboard.sidebar.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const links: LinkItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { label: "Argus Demo", href: "/dashboard/demo", icon: Bot },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 224 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={[
        "sticky top-6 self-start",                // no topbar → sit near top
        "rounded-2xl border border-white/10",
        "bg-slate-900/80 backdrop-blur-xl",
        "shadow-[0_8px_24px_rgba(0,0,0,.22)]",
        collapsed ? "p-2" : "p-3",
        "max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar", // scrollable, but no visible bars
      ].join(" ")}
      style={{ willChange: "width" }}
    >
      {/* Collapse control */}
      <div className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-end"}`}>
        <button
          onClick={() => setCollapsed((v) => !v)}
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
              {/* icon bubble */}
              <div
                className={[
                  "h-7 w-7 grid place-items-center rounded-md",
                  isActive ? "bg-slate-900 text-slate-100" : "bg-white/10 text-white/90",
                ].join(" ")}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>

              {/* label */}
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("dashboard.sidebar.collapsed") === "1";
  });

  // keep grid + sidebar widths in lockstep
  const gridCols = useMemo(
    () => ({ ["--sidebar" as any]: collapsed ? "72px" : "224px" }),
    [collapsed]
  );

  useEffect(() => {
    const i = setInterval(() => {
      const v = localStorage.getItem("dashboard.sidebar.collapsed") === "1";
      setCollapsed(v);
    }, 150);
    return () => clearInterval(i);
  }, []);

  return (
    <main className="relative min-h-screen bg-slate-950">
      {/* soft grid background */}
      <div className="pointer-events-none absolute inset-0 bg-grid" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-6">
        <div
          className="grid items-start gap-6 md:grid-cols-[var(--sidebar)_minmax(0,1fr)]"
          style={gridCols}
        >
          {/* Sidebar */}
          <DashSidebar />

          {/* Content */}
          <section className="min-w-0 space-y-6">
            {children}
          </section>
        </div>
      </div>

      {/* hide scrollbars utility (like sandbox) */}
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