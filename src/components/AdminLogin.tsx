import { FormEvent, useState } from "react";

interface AdminLoginProps {
  onAuthenticated: () => void;
}

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const responseText = await response.text();
      let result: { error?: string } = {};
      try {
        result = JSON.parse(responseText) as { error?: string };
      } catch {
        if (!response.ok) throw new Error("Admin service is temporarily unavailable.");
      }
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      setPassword("");
      onAuthenticated();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 selection:bg-amber-500/30">
      <div className="w-full max-w-sm space-y-4">
        {/* Admin Sign In Form */}
        <form onSubmit={handleSubmit} className="border border-white/10 bg-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-xs font-black uppercase tracking-[3px] text-amber-500">Restricted Admin Access</p>
            </div>
            <button
              type="button"
              onClick={() => { window.location.hash = "#/"; }}
              className="text-[10px] font-black uppercase text-white/40 hover:text-white"
            >
              ← Back
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Admin Sign In</h1>
            <p className="text-xs text-white/40 mt-1">
              Enter administrator email & password to access system console.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[3px] mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/60"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[3px] mb-1">
              Password
            </label>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Enter admin password..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/60"
            />
          </div>

          {error && <p className="text-xs font-bold text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={!password || isSubmitting}
            className="w-full bg-amber-500 text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:cursor-wait disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Authenticating..." : "Admin Login"}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => { window.location.hash = "#/login"; }}
            className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            Switch to User Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
