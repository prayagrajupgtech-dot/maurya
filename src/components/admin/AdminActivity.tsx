import { useEffect, useState } from "react";

interface LogItem {
  id: string;
  action: string;
  admin_id: string;
  target_user_id?: string | null;
  details?: string | null;
  created_at: string;
}

export default function AdminActivity() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/admin-activity");
        const data = await res.json();
        if (res.ok) setLogs(data.logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Admin Activity & Audit Logs</h2>
        <p className="text-xs text-white/40">Track administrative actions, user updates, plan changes, and card creations.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-black uppercase text-white/30 tracking-widest">
            Loading Logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs font-black uppercase text-white/30 tracking-widest">
            No activity logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase tracking-widest text-[10px] font-black">
                <tr>
                  <th className="p-5">Date & Time</th>
                  <th className="p-5">Action</th>
                  <th className="p-5">Admin</th>
                  <th className="p-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-5 text-white/40 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 font-black rounded-lg text-[10px] uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-5 text-white font-mono text-[11px]">{log.admin_id}</td>
                    <td className="p-5 text-white/70">{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
