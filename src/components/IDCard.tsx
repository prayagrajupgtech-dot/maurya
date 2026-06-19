import { forwardRef } from "react";

interface PersonData {
  name: string;
  phone: string;
  photo: string;
  idNumber: string;
  dob: string;
  address: string;
}

const IDCard = forwardRef<HTMLDivElement, { data: PersonData }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="w-[500px] h-[300px] rounded-xl overflow-hidden shadow-2xl relative select-none"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        fontFamily: "monospace",
      }}
    >
      {/* Top Header */}
      <div className="relative px-5 py-3 flex items-center justify-between bg-gradient-to-r from-red-600 to-red-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-400" fill="currentColor">
              <path d="M12 2L14 10H22L16 14L18 22L12 18L6 22L8 14L2 10H10Z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] tracking-widest text-white font-black uppercase">Maurya and Company</p>
            <p className="text-[10px] tracking-widest text-yellow-400 font-bold">समस्या निवारण</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[7px] text-white/50 uppercase">Unique ID</p>
          <p className="text-[12px] font-black text-yellow-400 tracking-wider">{data.idNumber}</p>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 flex gap-6">
        {/* Photo on Card */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-[110px] h-[130px] rounded-md border-2 border-white/10 overflow-hidden bg-black/20">
            {data.photo ? (
              <img src={data.photo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/10">
                <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
          <div className="w-[100px] h-[1px] bg-white/20" />
          <p className="text-[7px] text-white/30 tracking-widest uppercase">Signature</p>
        </div>

        {/* Details on Card */}
        <div className="flex-1 pt-1 space-y-3">
          <div>
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-0.5">Name / नाम</p>
            <p className="text-base font-black text-white uppercase tracking-tight leading-none">{data.name || "—"}</p>
          </div>
          
          <div className="flex gap-4">
            <div>
              <p className="text-[8px] text-white/40 uppercase tracking-widest mb-0.5">Phone / नंबर</p>
              <p className="text-xs font-bold text-white tracking-widest">{data.phone || "—"}</p>
            </div>
            <div>
              <p className="text-[8px] text-white/40 uppercase tracking-widest mb-0.5">DOB / तिथि</p>
              <p className="text-xs font-bold text-white tracking-widest">{data.dob || "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-0.5">Address / पता</p>
            <p className="text-[10px] font-bold text-white/80 leading-tight uppercase line-clamp-3">{data.address || "—"}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-black/20 flex items-center justify-between px-5">
        <p className="text-[7px] text-white/20 tracking-widest uppercase">Computer Generated ID</p>
        <p className="text-[7px] text-white/20 tracking-widest uppercase">Verification Required</p>
      </div>
    </div>
  );
});

IDCard.displayName = "IDCard";
export default IDCard;
