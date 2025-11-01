export const runtime = "edge";
import { NextResponse } from "next/server";

const SYS = 'You are "VIGIA Safety Copilot". Return JSON {"advice":"..."}; ≤20 words; imperative; no emojis.';

export async function POST(req: Request) {
  const body = await req.json();
  const ctx = {
    speed: Math.round(body?.vehicle?.speed_kmh ?? 0),
    precip: body?.env?.precip ?? "none",
    hazards: (body?.memory_topk ?? []).slice(0,2).map((h:any)=>({
      cls: h.class, dist_m: Math.round(h.dist_m ?? 0), sev: +(h.severity ?? 0.5).toFixed(2)
    }))
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY!}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{role:"system",content:SYS},{role:"user",content:JSON.stringify(ctx)}],
      temperature: 0.2,
      max_tokens: 25,
      response_format: { type: "json_object" }
    })
  });

  if (!r.ok) {
    const h = ctx.hazards?.[0];
    const fallback = h
      ? `Caution: ${h.cls.replaceAll("_"," ")} in ${h.dist_m} meters. Slow down.`
      : `Caution: potential road hazard ahead. Reduce speed.`;
    return NextResponse.json({ advice: fallback }, { status: 200 });
  }

  const data = await r.json();
  const advice = (() => {
    try { return JSON.parse(data.choices[0].message.content).advice || null; }
    catch { return null; }
  })() || "Drive carefully. Hazard risk ahead.";
  return NextResponse.json({ advice });
}