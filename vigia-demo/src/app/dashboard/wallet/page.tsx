export const dynamic = "force-dynamic"; // <- no static cache

import Link from "next/link";
// 1. Correct the import
import { createClient } from "@/lib/supabase/server";

export default async function WalletPage() {
  // 2. Correct the client instantiation (it's asynchronous)
  const supabase = await createClient();
  
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  // 3. This check is good!
  // Even though middleware protects this route, it's
  // good practice to handle the case where getUser() might fail.
  if (!user || userErr) {
    return (
      <div className="card-glass p-8 max-w-3xl">
        <h2 className="text-xl text-white font-semibold">Please sign in</h2>
        <p className="mt-2 text-white/70">You need an account to view your wallet.</p>
        <Link href="/auth/signin" className="btn-primary mt-4 inline-block">Go to sign in</Link>
        {userErr && <pre className="mt-3 text-xs text-red-300">{userErr.message}</pre>}
      </div>
    );
  }

  // User is guaranteed to exist at this point.
  const { data: wallet } = await supabase
    .from("wallets")
    .select("vgt_balance, dc_balance, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="card-glass p-6">
        <div className="text-white/70 text-sm">VGT balance</div>
        <div className="mt-2 text-3xl text-white font-semibold">{wallet?.vgt_balance ?? 0} VGT</div>
      </div>
      <div className="card-glass p-6">
        <div className="text-white/70 text-sm">Data Credits</div>
        <div className="mt-2 text-3xl text-white font-semibold">{wallet?.dc_balance ?? 0} DC</div>
      </div>
      <div className="card-glass p-6">
        <div className="text-white/70 text-sm">Last updated</div>
        <div className="mt-2 text-lg text-white">
          {wallet?.updated_at ? new Date(wallet.updated_at).toLocaleString() : "—"}
        </div>
      </div>
    </div>
  );
}
