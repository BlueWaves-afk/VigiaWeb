"use client";
import { useEffect, useRef } from "react";

export default function ForecastDemo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    // draw axes
    ctx.clearRect(0,0,c.width,c.height);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 10); ctx.lineTo(40, 180); ctx.lineTo(300, 180); ctx.stroke();

    // mock baseline + forecast with band
    const base: number[] = Array.from({length: 24}, (_,t) => 20 + 10*Math.sin(t/24*Math.PI*2) + Math.random()*3);
    const pred: number[] = base.map((v,i)=> i<18 ? v : v + 4*Math.sin(i)*0.5 + 2);
    // band
    ctx.fillStyle = "rgba(56,189,248,0.18)";
    ctx.beginPath();
    pred.forEach((v,i)=>{
      const x = 40 + (i* (260/23));
      const y = 180 - v;
      if (i===0) ctx.moveTo(x,y-6);
      else ctx.lineTo(x,y-6);
    });
    for (let i=pred.length-1;i>=0;i--){
      const x = 40 + (i* (260/23));
      const y = 180 - pred[i];
      ctx.lineTo(x,y+6);
    }
    ctx.closePath(); ctx.fill();

    // line
    ctx.strokeStyle = "rgba(56,189,248,0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pred.forEach((v,i)=>{
      const x = 40 + (i* (260/23));
      const y = 180 - v;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }, []);

  return (
    <div className="card-glass p-6">
      <div className="mb-3 text-white/80 text-sm">Predictive Hazard Density (mock)</div>
      <canvas ref={ref} width={320} height={200} className="w-full rounded-lg bg-black/20 border border-white/10" />
      <div className="mt-3 text-xs text-white/50">
        Swap the mock with a Prophet/ARIMA service or ONNX RNN; stream series per city/road.
      </div>
    </div>
  );
}