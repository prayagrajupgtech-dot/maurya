interface UserProfileProps {
  user: {
    email: string;
    display_name?: string;
    status?: string;
  } | null;
  assignedPlan: {
    name: string;
    price: number;
    duration_days: number;
    card_limit: number;
  } | null;
  cardsCount: number;
}

export default function UserProfilePage({ user, assignedPlan, cardsCount }: UserProfileProps) {
  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6">
        <div>
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[5px]">User Profile</span>
          <h2 className="text-2xl font-black uppercase mt-2">{user?.display_name || user?.email || "Account Profile"}</h2>
          <p className="text-xs text-white/40">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-white/10 pt-6">
          <div className="bg-black/30 p-5 rounded-2xl space-y-1">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Account Status</p>
            <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-black rounded-lg uppercase">
              {user?.status || "active"}
            </span>
          </div>

          <div className="bg-black/30 p-5 rounded-2xl space-y-1">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Assigned Plan (Read-Only)</p>
            <p className="font-black text-white text-base">{assignedPlan?.name || "Basic Plan"}</p>
            <p className="text-[11px] text-white/40 font-semibold">
              Limit: {assignedPlan?.card_limit === -1 ? "Unlimited" : `${assignedPlan?.card_limit || 100} Cards`}
            </p>
          </div>
        </div>

        <div className="bg-black/20 p-5 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Generated Cards</p>
            <p className="font-black text-white text-xl mt-1">{cardsCount} Cards Issued</p>
          </div>
          <span className="text-2xl">🪪</span>
        </div>
      </div>
    </div>
  );
}
