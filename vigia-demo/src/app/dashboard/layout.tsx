// src/app/dashboard/layout.tsx
"use client";
import { getSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  useEffect(() => {
    const s = getSession();
    if (!s) r.replace("/auth/signin");
  }, [r]);
  return <>{children}</>;
}