import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface CardRecord {
  id: string;
  card_number: string;
  name: string;
  phone: string;
  date_of_birth: string;
  address: string;
  status: string;
  created_at: string;
  user_id?: string | null;
}

export default function AdminCardsList() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getPublicBaseUrl = () => {
    return window.location.origin + window.location.pathname;
  };

  useEffect(() => {
    fetchCards();
  }, []);

  async function fetchCards() {
    try {
      const res = await fetch("/api/admin-cards");
      const data = await res.json();
      if (res.ok) setCards(data.cards || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCardAction(cardId: string, action: "activate" | "deactivate" | "delete") {
    if (action === "delete" && !confirm("Are you sure you want to delete this card? This cannot be undone.")) {
      return;
    }

    setActionLoading(cardId);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin-cards?cardId=${encodeURIComponent(cardId)}`, { method: "DELETE" });
        if (res.ok) {
          setCards(prev => prev.filter(c => c.id !== cardId));
        }
      } else {
        const res = await fetch("/api/admin-cards", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId, action })
        });
        if (res.ok) {
          setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: action === "activate" ? "active" : "blocked" } : c));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Generated Cards</h2>
        <p className="text-xs text-white/40">View and manage all ID card records. Activate, deactivate, or delete cards.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-black uppercase text-white/30 tracking-widest">
            Loading System Cards...
          </div>
        ) : cards.length === 0 ? (
          <div className="p-12 text-center text-xs font-black uppercase text-white/30 tracking-widest">
            No cards generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Card ID</th>
                  <th className="text-left p-4 text-[10px] font-black text-white/30 uppercase tracking-widest">User Name</th>
                  <th className="text-left p-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Mobile</th>
                  <th className="text-left p-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                  <th className="text-left p-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Created</th>
                  <th className="text-left p-4 text-[10px] font-black text-white/30 uppercase tracking-widest">QR</th>
                  <th className="text-right p-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map(c => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-amber-400 font-bold">{c.card_number}</td>
                    <td className="p-4 font-bold text-white">{c.name}</td>
                    <td className="p-4 text-white/70">{c.phone}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md font-black text-[9px] uppercase ${
                        c.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-white/40">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="bg-white p-1.5 rounded-lg inline-block">
                        <QRCodeCanvas value={`${getPublicBaseUrl()}#/verify/${c.card_number}`} size={36} />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === "active" ? (
                          <button
                            onClick={() => handleCardAction(c.id, "deactivate")}
                            disabled={actionLoading === c.id}
                            className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg font-black text-[9px] uppercase hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCardAction(c.id, "activate")}
                            disabled={actionLoading === c.id}
                            className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg font-black text-[9px] uppercase hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleCardAction(c.id, "delete")}
                          disabled={actionLoading === c.id}
                          className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg font-black text-[9px] uppercase hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
