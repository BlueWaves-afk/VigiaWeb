"use client";

import { useEffect, useState } from "react";
// 1. Import the correct function
import { createClient } from "@/lib/supabase/client";
// Import the type for better TypeScript support
import type { SupabaseClient } from "@supabase/supabase-js";

export default function AuthDebug() {
  // 2. Instantiate the client *once* using useState
  const [supabase] = useState<SupabaseClient>(() => createClient());

  const [sessionJson, setSessionJson] = useState<string>("(loading)");
  const [userJson, setUserJson] = useState<string>("(loading)");
  const [notice, setNotice] = useState<string>("");

  useEffect(() => {
    let unsub: (() => void) | null = null;

    const grab = async () => {
      const s = await supabase.auth.getSession();
      const u = await supabase.auth.getUser();
      setSessionJson(JSON.stringify(s.data?.session, null, 2));
      setUserJson(JSON.stringify(u.data?.user, null, 2));
    };

    grab();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setNotice(`Auth state: ${_event}`);
      // 3. Fixed a small typo (STRINGIFY -> stringify)
      setSessionJson(JSON.stringify(sess, null, 2));
      
      // Also refetch user for completeness
      supabase.auth.getUser().then((u) => {
        setUserJson(JSON.stringify(u.data?.user, null, 2));
      });
    });

    unsub = () => sub?.subscription?.unsubscribe();

    return () => { unsub?.(); };
  }, [supabase]); // This dependency is now stable

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Supabase Auth Debug</h1>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-white/80 mb-2">Notice</div>
          <pre className="text-xs whitespace-pre-wrap">{notice || "(none)"}</pre>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-white/80 mb-2">Session</div>
          <pre className="text-xs overflow-auto">{sessionJson}</pre>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-white/80 mb-2">User</div>
          <pre className="text-xs overflow-auto">{userJson}</pre>
        </div>

        <div className="flex gap-3">
          <button
            className="rounded-xl bg-white text-slate-900 px-4 py-2"
            onClick={async () => {
              await supabase.auth.signOut();
              setNotice("Signed out");
            }}
          >
            Sign out
          </button>
          <button
            className="rounded-xl bg-white/10 text-white px-4 py-2"
            onClick={async () => {
              const s = await supabase.auth.getSession();
              const u = await supabase.auth.getUser();
              setSessionJson(JSON.stringify(s.data?.session, null, 2));
              setUserJson(JSON.stringify(u.data?.user, null, 2));
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    </main>
  );
}
