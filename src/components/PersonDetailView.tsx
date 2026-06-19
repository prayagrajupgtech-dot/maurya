interface PersonData {
  name: string;
  phone: string;
  idNumber: string;
}

export default function PersonDetailView({ data }: { data: PersonData }) {
  const scanDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-4 sm:p-8 font-sans text-slate-900">
      {/* Official Certificate Style Container */}
      <div className="w-full max-w-lg bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-slate-200 relative">
        
        {/* Security Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <p className="text-6xl font-black rotate-45 uppercase">Maurya Verified Maurya Verified</p>
        </div>

        {/* Header Section */}
        <div className="bg-[#1e293b] text-white p-8 text-center relative">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <span className="text-2xl font-black text-black">M</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase leading-none">Maurya and Company</h1>
          <p className="text-amber-500 font-bold text-sm mt-1 tracking-[2px]">समस्या निवारण</p>
        </div>

        {/* Status Bar */}
        <div className="bg-emerald-500 py-2 px-4 flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span className="text-[10px] font-black text-white uppercase tracking-[2px]">Original Verified Record</span>
        </div>

        {/* Content Section */}
        <div className="p-8 sm:p-12 space-y-10 relative">
          
          {/* Main Details */}
          <div className="space-y-8">
            <div className="border-l-4 border-slate-200 pl-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px] mb-2">Full Name / नाम</p>
              <p className="text-3xl font-black text-slate-800 uppercase tracking-tight break-words">
                {data.name || "UNAVAILABLE"}
              </p>
            </div>

            <div className="border-l-4 border-slate-200 pl-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px] mb-2">Phone Number / नंबर</p>
              <p className="text-2xl font-bold text-slate-700 tracking-widest">
                {data.phone || "UNAVAILABLE"}
              </p>
            </div>
          </div>

          {/* Verification Meta */}
          <div className="pt-10 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Record ID</p>
              <p className="text-[11px] font-mono font-bold text-slate-600 uppercase">{data.idNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scan Date</p>
              <p className="text-[11px] font-bold text-slate-600">{scanDate}</p>
            </div>
          </div>

          {/* Security Stamp Overlay */}
          <div className="absolute bottom-12 right-12 w-24 h-24 border-4 border-emerald-500/20 rounded-full flex items-center justify-center -rotate-12 pointer-events-none">
            <div className="text-[8px] font-black text-emerald-600/30 text-center uppercase tracking-tighter">
              Authentic<br/>Data<br/>Maurya & Co.
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[2px]">
            Digital Verification System • Secure Access
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <p className="mt-8 text-[10px] text-slate-400 text-center max-w-xs leading-relaxed">
        This is a system-generated original record. Information provided is strictly for identity verification purposes.
      </p>

      {/* Back Button (Small and discrete) */}
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
