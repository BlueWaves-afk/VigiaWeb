"use client";
import { useState } from "react";

export default function CodeDemo() {
  const [copied, setCopied] = useState(false);
  const code = `import vigia_argus
from ultralytics import YOLO

m = YOLO(vigia_argus.model_yaml("argus_v8x.yaml"))
m.export(format="tflite", int8=True)
# ready for on-device`;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24">
      <div className="card-glass relative p-6">
        <pre className="overflow-x-auto whitespace-pre text-sm leading-relaxed text-white/90">
{code}
        </pre>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1400); }}
          className="absolute right-4 top-4 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/15"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </section>
  );
}