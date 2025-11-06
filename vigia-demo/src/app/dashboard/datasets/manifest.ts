// src/app/(dashboard)/datasets/manifest.ts
export type LocalDataset = {
  slug: string;
  title: string;
  region: string;
  version: string;
  price_dc: number;
  size_bytes: number;
};

export const LOCAL_DATASETS: LocalDataset[] = [
  {
    slug: "blr-core-tiles-2025-10",
    title: "Bengaluru Core Hazard Tiles (Oct 2025)",
    region: "IN-KA",
    version: "2025.10",
    price_dc: 250,
    size_bytes: 1_048_576,
  },
  {
    slug: "blr-ringroad-tiles-2025-10",
    title: "Bengaluru Ring Road Tiles (Oct 2025)",
    region: "IN-KA",
    version: "2025.10",
    price_dc: 180,
    size_bytes: 786_432,
  },
  // add more slugs here as you add files in /public/datasets
];

export function getLocalDataset(slug: string) {
  return LOCAL_DATASETS.find((d) => d.slug === slug) || null;
}