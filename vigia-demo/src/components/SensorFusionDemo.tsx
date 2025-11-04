"use client";
import { useRef, useState } from "react";

export default function SensorFusionDemo() {
  const [imgURL, setImgURL] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgURL(url);
    // mock draw boxes after load
    setTimeout(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d"); if (!ctx) return;
      ctx.clearRect(0,0,c.width,c.height);
      ctx.strokeStyle = "rgba(56,189,248,0.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 50, 160, 120); // mock bbox
      ctx.fillStyle = "rgba(56,189,248,0.15)";
      ctx.fillRect(60,50,160,120);
      // mock radar points
      ctx.fillStyle = "rgba(99,102,241,0.9)";
      for (let i=0;i<10;i++){
        ctx.beginPath();
        ctx.arc(70 + Math.random()*260, 60 + Math.random()*150, 3, 0, Math.PI*2);
        ctx.fill();
      }
    }, 150);
  }

  return (
    <div className="card-glass p-6">
      <div className="mb-3 text-white/80 text-sm">Multimodal Perception (mock overlay)</div>
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
          <div className="text-xs text-white/60 mb-2">Image</div>
          {imgURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgURL} alt="upload" className="rounded-md w-full" />
          ) : (
            <div className="h-48 grid place-items-center text-white/50">Upload an image</div>
          )}
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
          <div className="text-xs text-white/60 mb-2">Overlay</div>
          <canvas ref={canvasRef} width={360} height={220} className="w-full rounded-md bg-black/40" />
        </div>
      </div>
      <div className="mt-3 text-xs text-white/50">
        Swap mock with ONNX inference + radar CSV overlay.
      </div>
    </div>
  );
}