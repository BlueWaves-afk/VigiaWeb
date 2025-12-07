"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 font-mono text-xs font-medium text-slate-400 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-900/80 hover:text-slate-300 light:border-slate-300 light:bg-white/50 light:text-slate-600 light:hover:border-slate-400 light:hover:bg-white/80 light:hover:text-slate-700"
      aria-label="Toggle theme"
    >
      {/* Icon */}
      <div className="relative h-4 w-4">
        <Sun className="absolute inset-0 h-4 w-4 rotate-0 scale-100 transition-all light:rotate-90 light:scale-0" />
        <Moon className="absolute inset-0 h-4 w-4 rotate-90 scale-0 transition-all light:rotate-0 light:scale-100" />
      </div>
      
      {/* Label */}
      <span className="hidden sm:inline">
        {theme === "dark" ? "DARK" : "LIGHT"}
      </span>
      
      {/* Terminal cursor blink effect */}
      <span className="h-3.5 w-[2px] animate-pulse bg-cyan-500 light:bg-blue-600" />
    </button>
  );
}
