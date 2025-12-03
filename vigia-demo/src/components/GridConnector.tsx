// src/components/GridConnector.tsx
export default function GridConnector() {
  return (
    <div className="relative h-20 w-full overflow-hidden border-x border-slate-700/60 bg-[#0B1120]">
      <div className="absolute inset-0 flex items-center justify-between">
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} className="h-full w-px bg-slate-800/40" />
        ))}
      </div>
    </div>
  );
}
