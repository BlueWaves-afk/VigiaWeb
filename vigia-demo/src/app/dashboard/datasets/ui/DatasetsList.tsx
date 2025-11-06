// app/(dashboard)/datasets/ui/DatasetsList.tsx
"use client";

import { useTransition, useState } from "react";
import { motion } from "framer-motion";
import { purchaseAndGetDownload, getSignedDownload } from "../actions";

type Dataset = {
  id: string;                // kept for display/debug if you still have it
  slug: string;              // ← primary key for actions/ownership
  title: string;
  region: string;
  tiles: string[];           // tile IDs shown to user
  version: string;
  price_dc: number;
  size_bytes: number;
  created_at: string;
};

export function DatasetsList({
  datasets,
  ownedIds,                  // ← Set of slugs the user owns
}: {
  datasets: Dataset[];
  ownedIds: Set<string>;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"ok" | "err">("ok");

  const notify = (text: string, tone: "ok" | "err" = "ok") => {
    setMsg(text);
    setMsgTone(tone);
  };

  const buyAndDownload = (ds: Dataset) =>
    startTransition(async () => {
      setMsg(null);
      try {
        const { url } = await purchaseAndGetDownload(ds.slug);
        // trigger download
        window.location.href = url;
        notify(`Unlocked "${ds.title}" ✓`, "ok");
      } catch (e: any) {
        notify(e?.message || "Purchase failed", "err");
      }
    });

  const downloadOwned = (ds: Dataset) =>
    startTransition(async () => {
      setMsg(null);
      try {
        const { url } = await getSignedDownload(ds.slug);
        window.location.href = url;
      } catch (e: any) {
        notify(e?.message || "Could not download", "err");
      }
    });

  return (
    <>
      {msg && (
        <div
          className={[
            "mb-4 rounded-md border px-3 py-2",
            msgTone === "ok"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-400/30 bg-red-500/10 text-red-200",
          ].join(" ")}
        >
          {msg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {datasets.map((d, i) => {
          const owned = ownedIds.has(d.slug); // ← check by slug
          const sizeMB = (d.size_bytes / (1024 * 1024)).toFixed(2);

          return (
            <motion.div
              key={d.slug}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: "easeOut" }}
              className="group rounded-xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="truncate text-white font-medium">{d.title}</h3>
                <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70">
                  {d.version}
                </span>
              </div>

              <div className="text-sm text-white/70">
                Region: <span className="text-white/90">{d.region}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-white/60">
                <span className="truncate">
                  Tiles:{" "}
                  {d.tiles.length
                    ? d.tiles.slice(0, 3).join(", ") +
                      (d.tiles.length > 3 ? ` +${d.tiles.length - 3}` : "")
                    : "—"}
                </span>
                <span>{sizeMB} MB</span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-white/80">
                  <span className="text-white font-semibold">{d.price_dc}</span> DC
                </div>

                {!owned ? (
                  <button
                    disabled={pending}
                    onClick={() => buyAndDownload(d)}
                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-white/90 disabled:opacity-60"
                  >
                    {pending ? "Processing…" : "Buy & Unlock"}
                  </button>
                ) : (
                  <button
                    disabled={pending}
                    onClick={() => downloadOwned(d)}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/90 hover:bg-white/5 disabled:opacity-60"
                  >
                    {pending ? "Preparing…" : "Download JSON"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}