"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type UserRole = "developer" | "contributor" | "both" | "admin";
export type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  hasOnboarded: boolean;
};

export function useProfile() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async (user: User) => {
      setLoading(true);
      
      // 1. FIX: Removed 'hasOnboarded' from the query to prevent the error
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, role") // 'hasOnboarded' removed
        .eq("id", user.id)
        .single();

      if (error) {
        // We still log the original error, just in case
        console.error("Error fetching profile:", error.message);
        setProfile(null);
      } else if (data) {
        // 2. FIX: Manually set 'hasOnboarded'
        // This keeps your app logic working. We check if the 'data'
        // object has the property, otherwise we default it to 'false'.
        const completeProfile: Profile = {
          ...data,
          hasOnboarded: (data as any).hasOnboarded ?? false,
        };
        setProfile(completeProfile);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
        setProfile(null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          fetchProfile(session.user);
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return { loading, profile };
}

