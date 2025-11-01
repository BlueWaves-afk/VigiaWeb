// src/workers/llm.ts
export {};
declare const self: DedicatedWorkerGlobalScope;

import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

// ---------- model pick ----------
function pickSupported(preferred: string, fallbacks: string[]) {
  const ids = new Set(prebuiltAppConfig.model_list.map(m => m.model_id));
  for (const id of [preferred, ...fallbacks]) if (ids.has(id)) return id;
  return prebuiltAppConfig.model_list[0].model_id;
}
const MODEL_ID = pickSupported(
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  ["Llama-3.2-1B-Instruct-q4f32_1-MLC", "Phi-3.5-mini-instruct-q4f16_1-MLC"]
);

let enginePromise: Promise<any> | null = null;
function getEngine() {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (p: any) => self.postMessage({ type: "llm:init", progress: p }),
    });
  }
  return enginePromise;
}

// ---------- helpers ----------
function primaryHazard(list: any[]) {
  // Score: nearer + more severe
  return [...list]
    .map(h => ({ ...h, dist_m: Math.max(0, Math.round(h.dist_m ?? 0)), sev: +(h.sev ?? 0.5) }))
    .sort((a, b) => (a.dist_m - b.dist_m) || (b.sev - a.sev))[0];
}

self.onmessage = async (e: MessageEvent<any>) => {
  const { type, ctx } = e.data || {};
  try {
    if (type === "warmup") {
      await getEngine();
      self.postMessage({ type: "llm:warmed" });
      return;
    }

    if (type === "advise") {
      const engine = await getEngine();

      // Pick ONE hazard to avoid vague multi-warnings
      const hazards = Array.isArray(ctx?.hazards) ? ctx!.hazards : [];
      const h = primaryHazard(hazards || []);
      const h_facts = h
        ? { cls: String(h.cls || "hazard"), distance_m: Math.max(0, Math.round(h.dist_m || 0)), severity: +(h.sev ?? 0.5) }
        : { cls: "hazard", distance_m: 0, severity: 0.4 };

      // ---------- System rules (strict) ----------
      const sys = `
You are "VIGIA Safety Copilot".
- Output EXACTLY JSON: {"say":"..."} with one short, actionable instruction.
- 6–18 words. Imperative mood. No greetings/acknowledgements.
- If distance_m > 0 you MUST include the exact phrase: "in <distance_m> meters".
- Mention rain caution if precip == "rain".
- Never merge multiple hazards; warn only for the provided one.
- No emojis. No extra keys.
`.trim();

      // ---------- Few-shot (distance is always verbalized) ----------
      const shots = [
        {
          facts: { speed_kmh: 42, precip: "rain", hazard: { cls: "pothole", distance_m: 80, severity: 0.6 } },
          out:   { say: "Wet road. Ease to 30 km/h; sharp pothole in 80 meters." }
        },
        {
          facts: { speed_kmh: 55, precip: "none", hazard: { cls: "speed_breaker_unmarked", distance_m: 120, severity: 0.5 } },
          out:   { say: "Unmarked speed breaker in 120 meters. Brake smoothly; hold lane center." }
        },
        {
          facts: { speed_kmh: 35, precip: "none", hazard: { cls: "stalled_vehicle", distance_m: 70, severity: 0.8 } },
          out:   { say: "Stalled vehicle in 70 meters. Lift off throttle; prepare to merge right." }
        }
      ];

      const userFacts = {
        speed_kmh: Math.round(ctx?.speed ?? 0),
        precip: ctx?.precip ?? "none",
        hazard: h_facts
      };

      const messages = [
        { role: "system", content: sys },
        { role: "user", content: JSON.stringify(shots[0].facts) },
        { role: "assistant", content: JSON.stringify(shots[0].out) },
        { role: "user", content: JSON.stringify(shots[1].facts) },
        { role: "assistant", content: JSON.stringify(shots[1].out) },
        { role: "user", content: JSON.stringify(shots[2].facts) },
        { role: "assistant", content: JSON.stringify(shots[2].out) },
        { role: "user", content: JSON.stringify(userFacts) }
      ];

      const out = await engine.chat.completions.create({
        messages,
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 32
      });

      const raw = out?.choices?.[0]?.message?.content?.trim() ?? "";
      let advice = "";

      // Parse JSON; harden against chatty replies
      try {
        const parsed = JSON.parse(raw);
        advice = String(parsed.say || "").trim();
      } catch {
        advice = raw
          .replace(/^("?\s*)?(Understood|Okay|Sure|Noted|Affirmative)[^A-Za-z0-9]+/i, "")
          .replace(/^[“"]|[”"]$/g, "")
          .split(/[.?!]/)[0]
          .trim();
      }

      // Enforce distance phrase if we have a distance
      if (h_facts.distance_m > 0 && !/\bin\s+\d+\s+meters?\b/i.test(advice)) {
        const nm = h_facts.cls.replaceAll("_", " ");
        advice = `${nm} in ${h_facts.distance_m} meters. Slow and prepare.`;
      }

      // Trim length and finalize
      if (!advice) advice = "Reduce speed; hazard ahead. Hold lane and scan.";
      if (advice.length > 90) advice = advice.slice(0, 90).replace(/\s+\S*$/, "") + ".";

      self.postMessage({ type: "llm:advice", advice });
    }
  } catch (err: any) {
    self.postMessage({ type: "llm:error", message: String(err?.message || err) });
  }
};