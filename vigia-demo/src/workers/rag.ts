// src/workers/rag.ts
export {};
declare const self: DedicatedWorkerGlobalScope;

import * as turf from "@turf/turf";
import * as h3 from "h3-js";

type Query = {
  lat: number; lng: number; speedKmh: number; headingDeg: number;
  isRain: boolean; city: string; k?: number;
};
type Memory = {
  class: string; lat: number; lng: number;
  severity?: number; last_seen?: string; weather?: string[];
};
type CityMem = Record<string, Memory[]>;

const LOOKAHEAD = (vKmh:number) =>
  Math.max(180, Math.min(500, 2.5 * (vKmh * 1000 / 3600)));

const bearingDiff = (a:number,b:number) => {
  const d = ((a - b + 540) % 360) - 180;
  return Math.abs(d);
};

const normaliseCity = (c:string) =>
  (["bangalore","bengaluru","banglore"].includes(c.toLowerCase().trim())
    ? "bangalore" : c.toLowerCase().trim());

const cache: Record<string, CityMem> = {};
let BASE = "";

async function loadCityMemory(cityRaw: string) {
  const city = normaliseCity(cityRaw);
  if (cache[city]) return cache[city];
  if (!BASE) BASE = (self as any).location?.origin || "";

  const urls = [
    `${BASE}/data/${city}.json`,
    city === "bangalore" ? `${BASE}/data/banglore.json` : ""
  ].filter(Boolean);

  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = (await r.json()) as CityMem;
      // @ts-ignore
      console.log("GeoRAG loaded: –", url, "–", Object.keys(data).length, "–", "cells");
      cache[city] = data;
      return data;
    } catch {}
  }

  // tiny fallback
  cache[city] = {
    "8a2a1072b597fff": [
      { class:"pothole", lat:12.9719, lng:77.5946, severity:0.7, weather:["rain"] }
    ]
  };
  return cache[city];
}

self.onmessage = async (e: MessageEvent<any>) => {
  try {
    if (e.data?.type === "init") { BASE = e.data.base || ""; return; }

    const q = e.data as Query;
    const k = Math.max(1, Math.min(5, q.k ?? 3));
    const mem = await loadCityMemory(q.city);

    // ---- Candidate cell selection (wider net) ----
    const res = 9;

    // current position ring (radius 2)
    const cellNow = h3.latLngToCell(q.lat, q.lng, res);
    const nowRing = h3.gridDisk(cellNow, 2);

    // look-ahead ring (radius 2)
    const meters = LOOKAHEAD(q.speedKmh);
    const dest = turf.destination(
      turf.point([q.lng, q.lat]),
      meters / 1000,
      q.headingDeg,
      { units: "kilometers" }
    );
    const [plon, plat] = dest.geometry.coordinates;
    const cellAhead = h3.latLngToCell(plat, plon, res);
    const aheadRing = h3.gridDisk(cellAhead, 2);

    // union of both rings
    const cellSet = new Set<string>([...nowRing, ...aheadRing]);

    const candidates:any[] = [];
    const features: GeoJSON.Feature[] = [];

    // helper to process a single hazard
    const pushHaz = (h: Memory) => {
      const dist = turf.distance([q.lng,q.lat], [h.lng,h.lat], {units:"kilometers"}) * 1000;
      const bear = turf.bearing([q.lng,q.lat], [h.lng,h.lat]);

      // relaxed forward cone ±120°
      if (bearingDiff(bear, q.headingDeg) > 120) return;

      // relaxed cap 800 m
      if (dist > 800) return;

      const s_dist = Math.max(0, Math.min(1, 1 - dist/400));
      const s_sev  = Math.max(0, Math.min(1, h.severity ?? 0.5));
      const s_weather = q.isRain
        ? (h.weather?.includes("rain") ? 1 : 0)
        : (h.weather?.includes("rain") ? 0 : 0.5);

      const score = 0.45*s_dist + 0.25*s_sev + 0.10*s_weather;

      candidates.push({ ...h, dist_m: dist, bearing: bear, score });
      features.push({
        type:"Feature",
        geometry:{ type:"Point", coordinates:[h.lng,h.lat] },
        properties:{ class:h.class, severity:s_sev, dist_m:dist, score }
      } as GeoJSON.Feature);
    };

    // collect from neighborhood
    for (const c of cellSet) {
      const arr = mem[c];
      if (!arr) continue;
      for (const h of arr) pushHaz(h);
    }

    // brute-force fallback: if nothing found in rings, scan all cells
    if (candidates.length === 0) {
      for (const arr of Object.values(mem)) {
        for (const h of arr) pushHaz(h);
      }
    }

    // sort & trim
    candidates.sort((a,b)=>b.score-a.score);
    const topk = candidates.slice(0, k);

    // Debug summary
    // @ts-ignore
    console.log("RAG topk: –", topk.map(t => ({ cls:t.class, m:Math.round(t.dist_m) })), `(${topk.length})`);

    const fc: GeoJSON.FeatureCollection = { type:"FeatureCollection", features };

    // ✅ include meta for your console
    self.postMessage({
      topk,
      geojson: fc,
      meta: {
        lat: q.lat,
        lng: q.lng,
        speedKmh: q.speedKmh,
        headingDeg: q.headingDeg,
        isRain: q.isRain,
        ringCount: cellSet.size,
        ringNow: nowRing.length,
        ringAhead: aheadRing.length
      }
    });
  } catch (err) {
    console.error("GeoRAG worker error:", err);
    self.postMessage({
      topk: [],
      geojson: { type:"FeatureCollection", features: [] },
      meta: null
    });
  }
};