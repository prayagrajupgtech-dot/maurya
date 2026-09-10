interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md px-8 py-5 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-black uppercase tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-xs text-white/40 font-semibold">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Admin Mode</span>
      </div>
    </header>
  );
}
