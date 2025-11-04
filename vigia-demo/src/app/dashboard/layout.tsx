// src/app/dashboard/layout.tsx
"use client"; // This is needed for the sidebar to read the URL path

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Bot,
  Settings,
  LogOut,
} from "lucide-react";

// Import the Server Action for signing out
import { signOut } from "@/lib/auth";

// --- This is the Sidebar Component ---
// We define it here so this file can be "use client"
function DashSidebar() {
  const pathname = usePathname();

  const links = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Wallet",
      href: "/dashboard/wallet",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "Argus Demo",
      href: "/dashboard/demo",
      icon: <Bot className="h-4 w-4" />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="sticky top-28 flex h-[calc(100vh-8rem)] w-56 shrink-0 flex-col gap-4">
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* --- SIGN OUT BUTTON --- */}
      {/* This form calls the 'signOut' Server Action */}
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </aside>
  );
}

// --- This is the main Layout Component ---
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen bg-slate-950">
      {/* grid background */}
      <div className="pointer-events-none absolute inset-0 bg-grid" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        {/* FIX: Added top padding (pt-20 md:pt-24) to push the content
          below your fixed TopBar
        */}
        <div className="flex gap-6 pt-20 md:pt-24">
          <DashSidebar />
          <section className="flex-1 py-8 md:py-12">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}