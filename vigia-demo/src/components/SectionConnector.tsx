export default function SectionConnector() {
    return (
        <div className="relative h-12 w-full overflow-hidden bg-[#0B1120]">
            {/* Fine grid background pattern with vertical bars */}
            <div className="absolute inset-0 flex items-center justify-center gap-16">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-full w-px bg-slate-800/40"
                    />
                ))}
            </div>

            {/* Optional gradient overlay for depth */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent" />
        </div>
    );
}
