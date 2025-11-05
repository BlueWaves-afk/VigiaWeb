// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./ui";

export default async function DashboardPage() {
  // Supabase server client (matches your auth.ts usage)
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    // preserve intent after login
    redirect("/auth/signin?redirect=/dashboard");
  }

  const user = data.user;
  return <DashboardClient user={{ id: user.id, email: user.email ?? undefined }} />;
}