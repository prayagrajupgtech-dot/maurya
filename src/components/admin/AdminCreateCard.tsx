import { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  planId: string | null;
  planName: string;
}

interface PlanItem {
  id: string;
  name: string;
}

export default function AdminCreateCard() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState("");
  const [signature, setSignature] = useState("");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const qrSectionRef = useRef<HTMLDivElement>(null);

  // Generated Card State
  const [generatedCard, setGeneratedCard] = useState<{
    id: string;
    cardNumber: string;
    name: string;
    phone: string;
    dob: string;
    address: string;
    photo: string;
    signature: string;
    planName: string;
  } | null>(null);

  // QR State
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [usersRes, plansRes] = await Promise.all([
          fetch("/api/admin-users"),
          fetch("/api/admin-plans")
        ]);
        const usersData = await usersRes.json();
        const plansData = await plansRes.json();

        if (usersRes.ok) setUsers(usersData.users || []);
        if (plansRes.ok) setPlans(plansData.plans || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleSelectUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const u = users.find(x => x.id === userId);
    if (u) {
      setEmail(u.email);
      setName(u.name);
      setPhone(u.phone || "");
      if (u.planId) setSelectedPlanId(u.planId);
    }
  };

  const handleImageFile = (field: "photo" | "signature", file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === "photo") setPhoto(reader.result as string);
      else setSignature(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email || !name || !phone || !dob || !address) {
      setError("Email and all card details are required.");
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch("/api/admin-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          planId: selectedPlanId || null,
          name,
          phone,
          dateOfBirth: dob,
          address
        })
      });

      const data = await res.json();
      if (res.ok) {
        const planName = plans.find(p => p.id === selectedPlanId)?.name || "Basic";
        setGeneratedCard({
          id: data.id,
          cardNumber: data.cardNumber,
          name,
          phone,
          dob,
          address,
          photo,
          signature,
          planName
        });
        setSuccessMessage(`Card ${data.cardNumber} created successfully. ${data.isNewAccount ? "New user account created." : "Card linked to existing account."}`);
        setQrGenerated(false);
        setQrCopied(false);
      } else {
        setError(data.error || "Could not generate card.");
      }
    } catch {
      setError("Network error generating card.");
    } finally {
      setGenerating(false);
    }
  };

  const getVerificationUrl = () => {
    if (!generatedCard) return "";
    return `${window.location.origin}${window.location.pathname}#/verify/${generatedCard.cardNumber}`;
  };

  const handleCopyLink = () => {
    const url = getVerificationUrl();
    navigator.clipboard.writeText(url).then(() => {
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    });
  };

  const handleDownloadCard = async () => {
    const el = cardRef.current;
    if (!el) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      await document.fonts.ready;
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2, useCORS: true });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(res => res ? resolve(res) : reject(new Error("Image failed")), "image/png");
      });
      const objectUrl = URL.createObjectURL(blob);
      const safeName = generatedCard?.name.trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || "id";
      const link = document.createElement("a");
      link.download = `card-${safeName}.png`;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      window.alert("Card download failed.");
    }
  };

  const handlePrintCard = () => {
    const el = cardRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank", "width=600,height=400");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Print ID Card</title>
      <style>
        body { margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#111; }
        img { max-width:100%; height:auto; }
      </style></head><body></body></html>
    `);
    printWindow.document.close();
    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(el, { backgroundColor: null, scale: 2, useCORS: true }).then(canvas => {
        const img = printWindow.document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        printWindow.document.body.appendChild(img);
        setTimeout(() => { printWindow.print(); }, 300);
      });
    });
  };

  const handleBackToCards = () => {
    window.location.hash = "#/admin/cards";
  };

  const handleResetForm = () => {
    setGeneratedCard(null);
    setQrGenerated(false);
    setQrCopied(false);
    setSuccessMessage("");
    setError("");
    setEmail("");
    setName("");
    setPhone("");
    setDob("");
    setAddress("");
    setPhoto("");
    setSignature("");
    setSelectedUserId("");
    setSelectedPlanId("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-xs font-black uppercase tracking-[3px] text-white/40">Loading Admin Card Creator...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Admin Create ID Card</h2>
        <p className="text-xs text-white/40">Select a user, verify their plan, enter details, and issue an official ID & QR verification record.</p>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-black text-emerald-400 uppercase">{successMessage}</p>
            <button onClick={handleResetForm} className="text-[10px] text-white/40 hover:text-white underline mt-1">Create Another Card</button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-xs font-bold text-red-300">
          {error}
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={handleGenerate} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
        {/* Step 1: User Selection & Email */}
        <div className="border-b border-white/10 pb-6 space-y-4">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[4px]">Step 1 & 2: Select User & Plan</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Select User (Optional)</label>
              <select
                value={selectedUserId}
                onChange={e => handleSelectUserChange(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50 text-white"
              >
                <option value="">-- Direct Creation (Enter Email Below) --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email}) - {u.planName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">Select/Verify User Plan</label>
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50 text-white"
              >
                <option value="">-- Default Plan --</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">User Email Address *</label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com (account will be created if new)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50"
            />
            <p className="text-[10px] text-white/30 mt-1">First-time users will set their own password on first login.</p>
          </div>
        </div>

        {/* Step 3: Card Details */}
        <div className="space-y-4">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Step 3: Enter Card Information</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Full Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Phone Number</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Date of Birth</label>
              <input
                required
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-amber-500/50 [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Address</label>
              <input
                required
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Full Street Address"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Photo Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageFile("photo", e.target.files?.[0])}
                className="text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-white file:text-black hover:file:bg-white/80"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Signature Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageFile("signature", e.target.files?.[0])}
                className="text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-white file:text-black hover:file:bg-white/80"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase text-sm tracking-wider hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50"
        >
          {generating ? "Generating Card Record..." : "Step 4: Issue ID Card"}
        </button>
      </form>

      {/* ========================================
          GENERATED ID CARD RESULT
          ======================================== */}
      {generatedCard && (
        <div className="space-y-8">
          {/* ID Card Preview */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Success</span>
                <h3 className="text-xl font-black uppercase mt-1">Generated ID Card</h3>
              </div>
              <span className="font-mono text-xs bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-xl font-bold">
                {generatedCard.cardNumber}
              </span>
            </div>

            {/* The Actual ID Card */}
            <div className="flex justify-center">
              <div
                ref={cardRef}
                className="w-[500px] h-[300px] rounded-xl overflow-hidden relative select-none shadow-2xl shadow-black/50"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
                  color: "#ffffff",
                  fontFamily: "monospace",
                }}
              >
                {/* Header Bar */}
                <div
                  className="relative px-5 py-3 flex items-center justify-between"
                  style={{ background: "linear-gradient(90deg, #dc2626, #991b1b)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center border"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" style={{ color: "#facc15" }}>
                        <path d="M12 2L14 10H22L16 14L18 22L12 18L6 22L8 14L2 10H10Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] tracking-widest font-black uppercase" style={{ color: "#ffffff" }}>
                        Maurya and Company
                      </p>
                      <p className="text-[10px] tracking-widest font-bold" style={{ color: "#facc15" }}>
                        समस्या निवारण
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Unique ID</p>
                    <p className="text-[12px] font-black tracking-wider" style={{ color: "#facc15" }}>{generatedCard.cardNumber}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 pt-5 pb-10 flex gap-6">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div
                      className="w-[110px] h-[130px] rounded-md border-2 overflow-hidden"
                      style={{ backgroundColor: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      {generatedCard.photo ? (
                        <img src={generatedCard.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ color: "rgba(255,255,255,0.1)" }}>
                          <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div
                      className="w-[100px] h-[18px] flex items-center justify-center rounded-sm px-1"
                      style={{ backgroundColor: "#ffffff" }}
                    >
                      {generatedCard.signature ? (
                        <img src={generatedCard.signature} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-[1px]" style={{ backgroundColor: "#cbd5e1" }} />
                      )}
                    </div>
                    <p className="text-[7px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Signature</p>
                  </div>

                  <div className="flex-1 pt-1 space-y-2">
                    <div>
                      <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Name / नाम</p>
                      <p className="text-base font-black uppercase tracking-tight leading-none" style={{ color: "#ffffff" }}>
                        {generatedCard.name || "-"}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div>
                        <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Phone / नंबर</p>
                        <p className="text-xs font-bold tracking-widest" style={{ color: "#ffffff" }}>{generatedCard.phone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>DOB / तिथि</p>
                        <p className="text-xs font-bold tracking-widest" style={{ color: "#ffffff" }}>{generatedCard.dob || "-"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Address / पता</p>
                      <p
                        className="font-bold uppercase break-words"
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          fontSize: generatedCard.address.length > 80 ? "8px" : generatedCard.address.length > 45 ? "9px" : "10px",
                          lineHeight: "1.25",
                          overflowWrap: "anywhere"
                        }}
                      >
                        {generatedCard.address || "-"}
                      </p>
                    </div>

                    <div className="flex gap-4 pt-1">
                      <div>
                        <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Plan</p>
                        <p className="text-[10px] font-black tracking-wider" style={{ color: "#facc15" }}>{generatedCard.planName}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Status</p>
                        <p className="text-[10px] font-black tracking-wider" style={{ color: "#4ade80" }}>ACTIVE</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div
                  className="absolute bottom-0 inset-x-0 h-8 flex items-center justify-between px-5"
                  style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                >
                  <p className="text-[7px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>Digitally Generated Card</p>
                  <p className="text-[7px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>Verify With QR Code</p>
                </div>
              </div>
            </div>

            {/* Download & Print Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleDownloadCard}
                className="bg-white text-black font-black uppercase tracking-[2px] px-6 py-3 rounded-2xl text-[10px] hover:bg-white/80 transition-all"
              >
                Download ID Card
              </button>
              <button
                onClick={handlePrintCard}
                className="bg-white/10 text-white font-black uppercase tracking-[2px] px-6 py-3 rounded-2xl text-[10px] hover:bg-white/20 transition-all border border-white/10"
              >
                Print ID Card
              </button>
            </div>
          </div>

          {/* ========================================
              QR VERIFICATION SECTION
              ======================================== */}
          <div ref={qrSectionRef} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
            <div>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">QR Verification</span>
              <h3 className="text-xl font-black uppercase mt-1">Verify This ID Card</h3>
              <p className="text-xs text-white/40 mt-1">Scan this QR code to verify the ID card on any device.</p>
            </div>

            {!qrGenerated ? (
              <button
                onClick={() => setQrGenerated(true)}
                className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20"
              >
                Generate QR Code
              </button>
            ) : (
              <div className="space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-6 rounded-3xl shadow-xl">
                    <QRCodeCanvas
                      value={getVerificationUrl()}
                      size={200}
                      level="M"
                    />
                  </div>
                </div>

                {/* Verification URL */}
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Verification URL</p>
                  <p className="font-mono text-xs text-amber-400 break-all">{getVerificationUrl()}</p>
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopyLink}
                  className={`w-full font-black uppercase tracking-[2px] px-6 py-3 rounded-2xl text-[10px] transition-all ${
                    qrCopied
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
                  }`}
                >
                  {qrCopied ? "Verification Link Copied." : "Copy Verification Link"}
                </button>
              </div>
            )}
          </div>

          {/* Back to Cards */}
          <div className="text-center">
            <button
              onClick={handleBackToCards}
              className="text-xs font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
            >
              Back to Generated Cards
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
