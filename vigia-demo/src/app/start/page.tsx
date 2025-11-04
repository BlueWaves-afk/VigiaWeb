// src/app/page.tsx (or your "start" page)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile"; // 1. Import your hook

// A simple loading component (you can replace this)
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>
  );
}

export default function StartGate() {
  const r = useRouter();
  const { profile, loading } = useProfile(); // 2. Use the hook

  useEffect(() => {
    // 3. Wait until the hook is done loading
    if (loading) {
      return; // Still checking session, do nothing
    }

    // 4. Now we have a result, perform redirects
    if (!profile) {
      // User is not logged in
      r.replace("/auth/signin");
    } else if (!profile.hasOnboarded) {
      // User is logged in but hasn't onboarded
      r.replace("/onboarding");
    } else {
      // User is logged in and onboarded
      r.replace("/dashboard");
    }
  }, [loading, profile, r]); // 5. Depend on loading and profile state

  // 6. Show a loading screen while the check is in progress
  return <LoadingSpinner />;
}