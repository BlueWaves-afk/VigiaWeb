export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 light:border-slate-200 light:bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 text-sm text-white/60 light:text-slate-600">
        <span className="light:text-slate-700">© {new Date().getFullYear()} VIGIA</span>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:text-white light:hover:text-slate-900">Privacy</a>
          <a href="/terms" className="hover:text-white light:hover:text-slate-900">Terms</a>
        </div>
      </div>
    </footer>
  );
}