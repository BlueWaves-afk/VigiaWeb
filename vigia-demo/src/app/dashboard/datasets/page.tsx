// app/(dashboard)/datasets/page.tsx
import { createClient } from "@/lib/supabase/server";
import { DatasetsList } from "./ui/DatasetsList";

/** UI-facing type (match DatasetsList expectations exactly) */
type Dataset = {
  id: string;
  slug: string;         // used to build /datasets/${slug}.json
  title: string;
  region: string;       // e.g. "IN-KA"
  tiles: string[];      // H3 (or tile ids) shown in card
  version: string;      // e.g. "2025.10"
  price_dc: number;     // cost in Data Credits
  size_bytes: number;   // file size hint
  created_at: string;   // ISO string for sorting / display
};

/** Demo manifest (edit/extend freely).
 *  Put matching JSONs in /public/datasets/<slug>.json
 */
const MANIFEST: Dataset[] = [
  {
    id: "blr-core-2025-10",
    slug: "blr-core-tiles-2025-10",
    title: "Bengaluru Core Hazard Tiles (Oct 2025)",
    region: "IN-KA",
    tiles: ["892a7a2d6c3ffff", "892a7a2d6cbffff", "892a7a2d6c7ffff"],
    version: "2025.10",
    price_dc: 250,
    size_bytes: 1_048_576,
    created_at: "2025-10-28T00:00:00.000Z",
  },
  {
    id: "blr-ringroad-2025-10",
    slug: "blr-ringroad-tiles-2025-10",
    title: "Bengaluru ORR + Arterials (Oct 2025)",
    region: "IN-KA",
    tiles: [
      "892a7a2d6cfffff", "892a7a2d6d3ffff", "892a7a2d6d7ffff",
      "892a7a2d6dbffff", "892a7a2d6dfffff"
    ],
    version: "2025.10",
    price_dc: 200,
    size_bytes: 786_432,
    created_at: "2025-10-26T00:00:00.000Z",
  },
  {
    id: "blr-south-2025-11",
    slug: "blr-south-tiles-2025-11",
    title: "Bengaluru South Cluster (Nov 2025)",
    region: "IN-KA",
    tiles: [
      "892a7a2d6e3ffff","892a7a2d6e7ffff","892a7a2d6ebffff",
      "892a7a2d6efffff","892a7a2d6f3ffff"
    ],
    version: "2025.11",
    price_dc: 180,
    size_bytes: 655_360,
    created_at: "2025-11-01T00:00:00.000Z",
  },
  {
    id: "blr-free-sample",
    slug: "blr-sample-tiles",
    title: "Bengaluru Sample (Free)",
    region: "IN-KA",
    tiles: ["892a7a2d6c3ffff"],
    version: "2025.10",
    price_dc: 0,
    size_bytes: 64_000,
    created_at: "2025-10-20T00:00:00.000Z",
  },
];

type PurchaseRow = { dataset_id: string };

export default async function DatasetsPage() {
  const supa = await createClient();

  // Auth + credits
  const { data: userRes } = await supa.auth.getUser();
  const uid = userRes?.user?.id ?? null;

  let credits = 0;
  if (uid) {
    const { data: bal } = await supa
      .from("user_balances")
      .select("data_credits")
      .eq("user_id", uid)
      .single();
    credits = bal?.data_credits ?? 0;
  }

  // Owned dataset ids (by purchase) — keep DB usage minimal
  let purchases: PurchaseRow[] = [];
  if (uid) {
    const { data: purchasesRaw } = await supa
      .from("dataset_purchases")
      .select("dataset_id")
      .eq("user_id", uid)
      .returns<PurchaseRow[]>();
    purchases = purchasesRaw ?? [];
  }

  const owned = new Set<string>(purchases.map((p) => String(p.dataset_id)));
  // Free items are always "owned"
  MANIFEST.forEach((d) => {
    if (d.price_dc === 0) owned.add(d.id);
  });

  // Sort newest first
  const datasets = [...MANIFEST].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Datasets</h1>
          <p className="text-white/60">
            Latest hazard maps. Spend Data Credits to unlock downloads.
          </p>
          <p className="mt-1 text-xs text-white/40">
            Demo mode: dataset files are served statically from{" "}
            <code className="text-white/60">/public/datasets/&lt;slug&gt;.json</code>.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white/80">
          DC Balance: <span className="font-semibold">{credits}</span>
        </div>
      </div>

      <DatasetsList datasets={datasets} ownedIds={owned} />
    </div>
  );
}