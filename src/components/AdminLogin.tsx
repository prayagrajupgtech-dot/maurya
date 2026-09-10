import { FormEvent, useState } from "react";

interface AdminLoginProps {
  onAuthenticated: () => void;
}

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
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
        body: JSON.stringify({ password })
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
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        {/* Admin Sign In */}
        <form onSubmit={handleSubmit} className="border border-white/10 bg-white/5 rounded-2xl p-8">
          <p className="text-xs font-black uppercase tracking-[3px] text-amber-500">Restricted access</p>
          <h1 className="mt-3 text-2xl font-black uppercase">Admin sign in</h1>
          <label className="block mt-8 text-[10px] font-black text-white/40 uppercase tracking-[3px]">
            Password
          </label>
          <input
            autoComplete="current-password"
            autoFocus
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/60"
          />
          {error && <p className="mt-3 text-sm font-bold text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={!password || isSubmitting}
            className="mt-6 w-full bg-amber-500 text-black py-3 rounded-xl font-black uppercase tracking-widest disabled:cursor-wait disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-[3px] text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* User Sign In */}
        <button
          onClick={() => { window.location.hash = "#/user/login"; }}
          className="w-full border border-white/10 bg-white/5 rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
        >
          <p className="text-xs font-black uppercase tracking-[3px] text-white/40">User access</p>
          <h2 className="mt-2 text-lg font-black uppercase">User sign in</h2>
          <p className="mt-1 text-xs text-white/30">Sign in with your Google account</p>
        </button>

        <button
          type="button"
          onClick={() => { window.location.hash = "#/plans"; }}
          className="w-full py-3 text-xs font-black uppercase tracking-widest text-white/50 hover:text-white"
        >
          Return to plans
        </button>
      </div>
    </div>
  );
}
