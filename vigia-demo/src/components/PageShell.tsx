// src/components/PageShell.tsx
export default function PageShell({
  title,
  subtitle,
  children,
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-white/70">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}