"use client";

import { useTransition, useState } from "react";
import { actionAirdropVGT, actionBuyDC } from "./actions";
import { ArrowRight, Coins, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClientControls() {
  const r = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function run<T extends (...a: any[]) => Promise<any>>(fn: T, label: string) {
    setErr(null);
    setMsg(null);
    start(async () => {
      try {
        await fn();
        setMsg(`${label} successful.`);
        r.refresh();
      } catch (e: any) {
        setErr(e?.message ?? "Action failed");
      }
    });
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => run(() => actionAirdropVGT(10), "Airdrop")}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/90 px-4 py-2 font-medium text-slate-900 hover:bg-white"
          disabled={pending}
        >
          <Coins className="h-4 w-4" />
          Airdrop 10 VGT
        </button>

        <button
          onClick={() => run(() => actionBuyDC(500), "DC purchase")}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2 font-medium text-white hover:bg-emerald-500"
          disabled={pending}
        >
          <DollarSign className="h-4 w-4" />
          Buy 500 DC ($5)
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="text-white/60">
          {pending ? "Processing…" : msg ? <span className="text-emerald-300">{msg}</span> : " "}
          {err && <span className="text-red-300">{err}</span>}
        </div>
        <button
          onClick={() => r.refresh()}
          className="inline-flex items-center gap-1 text-white/70 hover:text-white"
          disabled={pending}
        >
          Refresh <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}