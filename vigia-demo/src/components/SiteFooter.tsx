export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 text-sm text-white/60">
        <span>© {new Date().getFullYear()} VIGIA</span>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:text-white">Privacy</a>
          <a href="/terms" className="hover:text-white">Terms</a>
        </div>
      </div>
    </footer>
  );
}