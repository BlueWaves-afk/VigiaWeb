"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Settings,
  LogOut,
  Map as MapIcon,
} from "lucide-react";
import { signOut } from "@/lib/auth";

type NavLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const LINKS: NavLink[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Datasets", href: "/dashboard/datasets", icon: MapIcon },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-6 self-start rounded-2xl border border-slate-800 bg-slate-950 p-4 light:border-slate-200 light:bg-white">
      {/* Logo */}
      <div className="mb-6 px-2">
        <Link href="/" className="text-xl font-semibold text-white light:text-slate-900">
          VIGIA
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-slate-900 light:bg-slate-900 light:text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white light:text-slate-600 light:hover:bg-slate-50 light:hover:text-slate-900"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="mt-6 border-t border-slate-800 pt-4 light:border-slate-200">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 light:text-slate-600 light:hover:bg-red-50 light:hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 light:bg-slate-50">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Sidebar />
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}