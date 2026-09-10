interface AdminSidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export default function AdminSidebar({ currentTab, onNavigate, onLogout }: AdminSidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "plans", label: "Plans", icon: "💎" },
    { id: "create-card", label: "Create ID Card", icon: "➕" },
    { id: "cards", label: "Cards / Generated", icon: "🪪" },
    { id: "activity", label: "Activity / Logs", icon: "📜" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-white/10 flex flex-col justify-between shrink-0 min-h-screen p-6">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-black shadow-lg shadow-amber-500/20 text-lg">
            AD
          </div>
          <div>
            <h1 className="font-black text-sm uppercase tracking-wider text-white">Admin Panel</h1>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Maurya System</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(item => {
            const isActive = currentTab === item.id || (item.id === "users" && currentTab.startsWith("users/"));
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-left ${
                  isActive
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-all text-left"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
