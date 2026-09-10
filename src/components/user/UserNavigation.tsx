interface UserNavigationProps {
  activeTab: "home" | "my-card" | "preview" | "profile";
  onTabChange: (tab: "home" | "my-card" | "preview" | "profile") => void;
  onLogout: () => void;
}

export default function UserNavigation({ activeTab, onTabChange, onLogout }: UserNavigationProps) {
  return (
    <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50 p-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div
          onClick={() => onTabChange("home")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-black shadow-lg shadow-amber-500/20">
            ID
          </div>
          <span className="font-black text-lg tracking-tighter uppercase text-white">Maurya Generator</span>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => onTabChange("home")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "home" ? "bg-amber-500 text-black" : "text-white/40 hover:text-white"
            }`}
          >
            HOME
          </button>
          <button
            onClick={() => onTabChange("my-card")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "my-card" ? "bg-amber-500 text-black" : "text-white/40 hover:text-white"
            }`}
          >
            MY CARD
          </button>
          <button
            onClick={() => onTabChange("preview")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "preview" ? "bg-amber-500 text-black" : "text-white/40 hover:text-white"
            }`}
          >
            PREVIEW
          </button>
          <button
            onClick={() => onTabChange("profile")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === "profile" ? "bg-amber-500 text-black" : "text-white/40 hover:text-white"
            }`}
          >
            MY PROFILE
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg text-xs font-black text-red-400 hover:text-red-300 transition-colors"
          >
            LOG OUT
          </button>
        </div>
      </div>
    </header>
  );
}
