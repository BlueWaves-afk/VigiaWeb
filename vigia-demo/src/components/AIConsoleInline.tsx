"use client";

type Log = { t: string; tag: "RAG" | "RULE" | "LLM" | "SYS"; msg: string };

export default function AIConsoleInline({ logs }: { logs: Log[] }) {
  return (
    <div
      className="mt-6 w-full overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
      aria-label="Copilot console"
    >
      {/* terminal title bar */}
      <div className="flex items-center gap-2 border-b border-[#2a2a2a] bg-[#141414] px-3 py-2">
        <div className="flex gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <div className="ml-3 text-xs tracking-widest text-[#b7b7b7]">COPILOT CONSOLE</div>
      </div>

      {/* scrollable log */}
      <div className="max-h-44 overflow-auto px-3 py-2 text-[13px] leading-relaxed">
        {logs.slice(-12).map((l, i) => (
          <div key={i} className="grid grid-cols-[80px_70px_1fr] gap-3">
            <span className="text-[#6b7280]">{l.t}</span>
            <span
              className={`text-center ${
                l.tag === "RAG"
                  ? "text-emerald-300"
                  : l.tag === "LLM"
                  ? "text-sky-300"
                  : l.tag === "SYS"
                  ? "text-zinc-300"
                  : "text-amber-300"
              }`}
            >
              [{l.tag}]
            </span>
            <span className="text-[#d6d6d6]">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}