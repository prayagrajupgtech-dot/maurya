import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../contexts/AuthContext";

interface UserData {
  profile: {
    id: string;
    email: string;
    display_name: string | null;
  };
  cards: Array<{
    id: string;
    card_number: string;
    name: string;
    phone: string;
    status: string;
    created_at: string;
  }>;
  subscription: {
    razorpay_subscription_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    status: string;
    trial_ends_at: string;
    current_start_at: string | null;
    current_end_at: string | null;
    paid_count: number;
    remaining_count: number;
    created_at: string;
  } | null;
}

function getPublicBaseUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;
  const url = new URL(window.location.href);
  if (url.hostname.endsWith(".netlify.app") && url.hostname.includes("--")) {
    url.hostname = url.hostname.split("--").pop() || url.hostname;
  }
  return url.origin + url.pathname;
}

export default function UserDashboard() {
  const { session, signOut } = useAuth();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.access_token) return;

    let cancelled = false;
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/user-dashboard", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${session!.access_token}`
          }
        });
        const result = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(result.error || "Failed to load dashboard.");
        } else {
          setData(result);
        }
      } catch {
        if (!cancelled) setError("Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { cancelled = true; };
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <p className="text-xs font-black uppercase tracking-[3px] text-white/40">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center border border-white/10 bg-white/5 rounded-3xl p-10">
          <h1 className="text-2xl font-black uppercase">Access Denied</h1>
          <p className="mt-3 text-sm text-white/50">{error}</p>
          <button
            onClick={async () => { await signOut(); window.location.hash = ""; }}
            className="mt-8 bg-amber-500 text-black font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-amber-500/30">
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-black shadow-lg shadow-amber-500/20">ID</div>
            <span className="font-black text-lg tracking-tighter uppercase">My Dashboard</span>
          </div>
          <button
            onClick={async () => { await signOut(); window.location.hash = ""; }}
            className="px-4 py-2 rounded-lg text-xs font-black text-white/40 hover:text-white transition-colors"
          >
            LOG OUT
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 sm:p-10 space-y-8">
        {/* Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-10">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[5px]">Account</span>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight">{data.profile.display_name || "User"}</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Email</p>
              <p className="mt-1 font-bold text-white/70">{data.profile.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">User ID</p>
              <p className="mt-1 font-bold text-white/70 font-mono text-xs break-all">{data.profile.id}</p>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-10">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[5px]">Subscription</span>
          {data.subscription ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  data.subscription.status === "authenticated" || data.subscription.status === "active"
                    ? "bg-emerald-400" : "bg-amber-400"
                }`} />
                <span className="font-black text-sm uppercase">{data.subscription.status}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Plan</p>
                  <p className="mt-1 font-bold text-white/70">₹99/month after trial</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Trial Ends</p>
                  <p className="mt-1 font-bold text-white/70">{new Date(data.subscription.trial_ends_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Billing Cycles</p>
                  <p className="mt-1 font-bold text-white/70">{data.subscription.paid_count} paid / {data.subscription.remaining_count} remaining</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Member Since</p>
                  <p className="mt-1 font-bold text-white/70">{new Date(data.subscription.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/50">No active subscription found.</p>
          )}
        </div>

        {/* Cards */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-10">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[5px]">My ID Cards</span>
          {data.cards.length > 0 ? (
            <div className="mt-6 space-y-6">
              {data.cards.map(card => (
                <div key={card.id} className="bg-black/20 border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-black text-lg">{card.name}</p>
                      <p className="text-sm text-white/50 font-mono">{card.card_number}</p>
                      <p className="text-sm text-white/50">{card.phone}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          card.status === "active" ? "bg-emerald-400" :
                          card.status === "expired" ? "bg-amber-400" : "bg-red-400"
                        }`} />
                        <span className="text-xs font-bold uppercase">{card.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-white p-4 rounded-xl">
                        <QRCodeCanvas
                          value={`${getPublicBaseUrl()}#/verify/${card.id}`}
                          size={120}
                          level="L"
                          marginSize={1}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const canvas = document.querySelector(`[data-card-id="${card.id}"] canvas`) as HTMLCanvasElement | null;
                          if (!canvas) {
                            const container = document.createElement("div");
                            container.style.display = "none";
                            container.setAttribute("data-card-id", card.id);
                            document.body.appendChild(container);
                          }
                          // Use the QR from the rendered element
                          const qrContainer = document.querySelector(`[data-card-id="${card.id}"]`) || document.querySelector(".bg-white.p-4.rounded-xl canvas")?.closest(".bg-white");
                          const canvasEl = qrContainer?.querySelector("canvas") as HTMLCanvasElement | null;
                          if (canvasEl) {
                            const link = document.createElement("a");
                            link.download = `qr-${card.card_number}.png`;
                            link.href = canvasEl.toDataURL();
                            link.click();
                          }
                        }}
                        className="bg-white text-black font-black uppercase tracking-[2px] px-4 py-2 rounded-xl text-[10px]"
                      >
                        Download QR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/50">No ID cards registered yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
