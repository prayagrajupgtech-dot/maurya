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
  const addressFontSize = data.address.length > 80 ? "8px" : data.address.length > 45 ? "9px" : "10px";

  return (
    <div
      ref={ref}
      className="w-[500px] h-[300px] rounded-xl overflow-hidden relative select-none"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        color: "#ffffff",
        fontFamily: "monospace",
      }}
    >
      <div
        className="relative px-5 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(90deg, #dc2626, #991b1b)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderColor: "rgba(255,255,255,0.3)"
            }}
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
          <p className="text-[12px] font-black tracking-wider" style={{ color: "#facc15" }}>{data.idNumber}</p>
        </div>
      </div>

      <div className="px-6 pt-5 pb-10 flex gap-6">
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div
            className="w-[110px] h-[130px] rounded-md border-2 overflow-hidden"
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              borderColor: "rgba(255,255,255,0.1)"
            }}
          >
            {data.photo ? (
              <img src={data.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ color: "rgba(255,255,255,0.1)" }}
              >
                <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
          <div className="w-[100px] h-[1px]" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
          <p className="text-[7px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
            Signature
          </p>
        </div>

        <div className="flex-1 pt-1 space-y-2">
          <div>
            <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Name / नाम
            </p>
            <p className="text-base font-black uppercase tracking-tight leading-none" style={{ color: "#ffffff" }}>
              {data.name || "-"}
            </p>
          </div>

          <div className="flex gap-4">
            <div>
              <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Phone / नंबर
              </p>
              <p className="text-xs font-bold tracking-widest" style={{ color: "#ffffff" }}>{data.phone || "-"}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                DOB / तिथि
              </p>
              <p className="text-xs font-bold tracking-widest" style={{ color: "#ffffff" }}>{data.dob || "-"}</p>
            </div>
          </div>

          <div>
            <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Address / पता
            </p>
            <p
              className="font-bold uppercase break-words"
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: addressFontSize,
                lineHeight: "1.25",
                overflowWrap: "anywhere"
              }}
            >
              {data.address || "-"}
            </p>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 inset-x-0 h-8 flex items-center justify-between px-5"
        style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      >
        <p className="text-[7px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>
          Digitally Generated Card
        </p>
        <p className="text-[7px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>
          Verify With QR Code
        </p>
      </div>
    </div>
  );
});

IDCard.displayName = "IDCard";
export default IDCard;
