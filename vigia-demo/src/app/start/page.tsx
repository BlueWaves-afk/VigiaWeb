"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function StartGate() {
  const r = useRouter();
  useEffect(() => {
    const s = getSession();
    if (!s) r.replace("/auth/signin");
    else if (!s.hasOnboarded) r.replace("/onboarding");
    else r.replace("/dashboard");
  }, [r]);
  return null;
}