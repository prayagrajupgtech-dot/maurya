import { useTheme } from "../../App";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className={`border-b px-8 py-5 flex items-center justify-between sticky top-0 z-40 ${isDark ? "border-white/10 bg-slate-900/50" : "border-gray-200 bg-white/80"} backdrop-blur-md`}>
      <div>
        <h1 className={`text-xl font-black uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h1>
        {subtitle && <p className={`text-xs font-semibold ${isDark ? "text-white/40" : "text-gray-500"}`}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            isDark
              ? "bg-white/10 text-white hover:bg-white/15"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span>{isDark ? "☀️" : "🌙"}</span>
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>
        <span className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse ${isDark ? "bg-emerald-400" : "bg-emerald-500"}`} />
        <span className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Admin Mode</span>
      </div>
    </header>
  );
}
