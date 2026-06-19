interface VerificationData {
  databaseVerified: boolean;
  idNumber: string;
  name: string;
  phone: string;
  status: "active" | "expired" | "blocked" | "legacy";
}

export default function PersonDetailView({ data }: { data: VerificationData }) {
  const scanDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric"
  });
  const isActive = data.databaseVerified && data.status === "active";
  const statusText = isActive
    ? "Active Database Record"
    : data.status === "blocked"
      ? "Blocked Record"
      : data.status === "expired"
        ? "Expired Record"
        : "Legacy QR - Not Database Verified";
  const statusColor = isActive
    ? "bg-emerald-500"
    : data.status === "legacy"
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-4 sm:p-8 font-sans text-slate-900">
      <div className="w-full max-w-lg bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-slate-200 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <p className="text-6xl font-black rotate-45 uppercase">Maurya Verification</p>
        </div>

        <div className="bg-[#1e293b] text-white p-8 text-center relative">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <span className="text-2xl font-black text-black">M</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Maurya and Company</h1>
          <p className="text-amber-500 font-bold text-sm mt-1 tracking-[2px]">समस्या निवारण</p>
        </div>

        <div className={`${statusColor} py-2 px-4 flex items-center justify-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-[2px]">{statusText}</span>
        </div>

        <div className="p-8 sm:p-12 space-y-10 relative">
          <div className="space-y-8">
            <div className="border-l-4 border-slate-200 pl-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px] mb-2">Full Name / नाम</p>
              <p className="text-3xl font-black text-slate-800 uppercase tracking-tight break-words">
                {data.name || "UNAVAILABLE"}
              </p>
            </div>

            <div className="border-l-4 border-slate-200 pl-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px] mb-2">Phone Number / नंबर</p>
              <p className="text-2xl font-bold text-slate-700 tracking-widest break-all">
                {data.phone || "UNAVAILABLE"}
              </p>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Card Number</p>
              <p className="text-[11px] font-mono font-bold text-slate-600 uppercase break-all">{data.idNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Checked At</p>
              <p className="text-[11px] font-bold text-slate-600">{scanDate}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[2px]">
            {data.databaseVerified ? "Live database verification" : "Legacy encoded QR record"}
          </p>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-slate-400 text-center max-w-xs leading-relaxed">
        Verification confirms whether this card record currently exists and is active in the issuer database.
      </p>

      <button
        onClick={() => {
          window.location.hash = "";
          window.location.reload();
        }}
        className="mt-6 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors underline underline-offset-4"
      >
        Close Record
      </button>
    </div>
  );
}
