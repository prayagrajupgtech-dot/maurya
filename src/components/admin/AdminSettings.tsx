export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Admin System Settings</h2>
        <p className="text-xs text-white/40">Configuration settings for system authentication, database security, and API keys.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6 text-xs">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">System Authentication Role</label>
          <p className="text-white/70 font-semibold">Role-Based Access Control (RBAC) is active. Normal user sessions are prohibited from calling `/api/admin/*` endpoints.</p>
        </div>

        <div className="space-y-2 pt-4 border-t border-white/10">
          <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Admin Password Secret</label>
          <p className="text-white/40">Secured server-side in `.env` variable `ADMIN_PASSWORD` & `ADMIN_SESSION_SECRET`.</p>
        </div>

        <div className="space-y-2 pt-4 border-t border-white/10">
          <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Database Connection</label>
          <p className="text-white/40">Connected to Supabase Serverless & Service Role API.</p>
        </div>
      </div>
    </div>
  );
}
