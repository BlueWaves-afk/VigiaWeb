"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Server Action to mark the user's onboarding as complete.
 */
export async function completeOnboarding() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/signin");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ hasOnboarded: true })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to complete onboarding:", error.message);
    // Redirect back to onboarding with an error
    return redirect("/onboarding?error=Could not complete onboarding. Please try again.");
  }

  // Revalidate the dashboard and root path to ensure data is fresh
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  
  // Redirect to the dashboard
  redirect("/dashboard");
}
