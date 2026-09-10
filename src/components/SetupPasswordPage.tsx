import { FormEvent, useState } from "react";

export default function SetupPasswordPage({ userId, email }: { userId: string; email: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSetup = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup-password", email, userId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set password.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 selection:bg-amber-500/30">
        <div className="w-full max-w-md space-y-6">
          <div className="border border-white/10 bg-white/5 rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[3px] text-emerald-400">Account Activated</p>
              <h1 className="mt-2 text-2xl font-black uppercase tracking-tight">Password Set Successfully</h1>
            </div>
            <p className="text-xs text-white/50">
              Your account is now active. You can sign in with your email and password.
            </p>
            <button
              onClick={() => { window.location.hash = "#/login"; }}
              className="w-full bg-amber-500 text-black py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 selection:bg-amber-500/30">
      <div className="w-full max-w-md space-y-6">
        <div className="border border-white/10 bg-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[3px] text-amber-500">Account Setup</p>
              <h1 className="mt-1 text-2xl font-black uppercase tracking-tight">Set Your Password</h1>
            </div>
            <button
              onClick={() => { window.location.hash = "#/login"; }}
              className="text-xs font-black uppercase text-white/40 hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
            <p className="text-xs font-bold text-amber-300">
              Welcome! An ID card has been created for <strong>{email}</strong>.
            </p>
            <p className="text-[10px] text-amber-300/60 mt-1">
              Set your password to activate your account and access your card.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs font-bold text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none text-white/50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">
                New Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">
                Confirm Password
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/60"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-500 text-black py-3.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? "Setting Password..." : "Activate Account"}
            </button>
          </form>
        </div>

        <div className="text-center">
          <button
            onClick={() => { window.location.hash = "#/login"; }}
            className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            Switch to Admin Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
