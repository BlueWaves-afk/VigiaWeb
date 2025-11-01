"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavLink = ({ href, icon, label }: { href:string; icon:string; label:string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 px-6 py-3 border-l-4 transition
          ${active ? "bg-teal-50 border-teal-600 text-teal-700 font-semibold"
                   : "border-transparent hover:bg-teal-50/60"}`}>
        <i className={`fa ${icon} w-5 text-center`} />
        <span>{label}</span>
      </Link>
    </li>
  );
};

export default function Sidebar(){
  return (
    <nav className="w-[260px] bg-white border-r border-[var(--border)] shadow-sm flex flex-col">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white grid place-items-center font-bold">V</div>
        <h1 className="text-2xl font-bold text-[var(--primary)]">VIGIA</h1>
      </div>

      <div className="mt-4">
        <h3 className="px-6 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Main</h3>
        <ul>
          <NavLink href="/dashboard" icon="fa-home" label="Dashboard" />
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="px-6 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Data Marketplace</h3>
        <ul>
          <NavLink href="/datasets" icon="fa-database" label="Browse Datasets" />
          <NavLink href="/burn-buy" icon="fa-fire" label="Burn & Buy" />
          <NavLink href="/orders" icon="fa-receipt" label="Orders & Invoices" />
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="px-6 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Analytics</h3>
        <ul>
          <NavLink href="/analytics/realtime" icon="fa-chart-line" label="Real-time" />
          <NavLink href="/analytics/trends" icon="fa-chart-bar" label="Trends & Cohorts" />
          <NavLink href="/analytics/reliability" icon="fa-shield" label="Reliability" />
        </ul>
      </div>

      <div className="mt-6 mb-8">
        <h3 className="px-6 pb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Management</h3>
        <ul>
          <NavLink href="/moderation" icon="fa-eye" label="Moderation" />
          <NavLink href="/api-integrations" icon="fa-code" label="API & Integrations" />
          <NavLink href="/wallet" icon="fa-wallet" label="Wallet & Credits" />
          <NavLink href="/users" icon="fa-users" label="Users & Roles" />
          <NavLink href="/settings" icon="fa-cog" label="Settings" />
        </ul>
      </div>
    </nav>
  );
}