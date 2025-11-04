"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, PlayCircle, Settings, LogOut } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/argus", label: "Argus Demo", icon: PlayCircle }, // optional
  { href: "/settings", label: "Settings", icon: Settings },   // optional
];

export default function DashSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-[100dvh] w-[248px] shrink-0 p-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
        <div className="mb-3 px-2">
          <div className="text-xs uppercase tracking-wide text-white/50">VIGIA</div>
          <div className="text-sm text-white/80">Console</div>
        </div>

        <nav className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-white text-slate-900"
                    : "text-white/80 hover:bg-white/10",
                ].join(" ")}
              >
                <Icon size={16} className={active ? "text-slate-900" : "text-white/70"} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 border-t border-white/10 pt-3">
          <form action="/auth/signout" method="post">
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10"
              type="submit"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}