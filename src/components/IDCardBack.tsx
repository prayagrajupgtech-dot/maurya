import { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface IDCardBackProps {
  cardNumber: string;
  subscriptionUrl: string;
}

const IDCardBack = forwardRef<HTMLDivElement, IDCardBackProps>(({ cardNumber, subscriptionUrl }, ref) => (
  <div
    ref={ref}
    className="w-[500px] h-[300px] rounded-xl overflow-hidden relative select-none"
    style={{
      background: "linear-gradient(135deg, #111827 0%, #1e293b 55%, #0f3460 100%)",
      color: "#ffffff",
      fontFamily: "monospace"
    }}
  >
    <div className="h-3" style={{ backgroundColor: "#dc2626" }} />
    <div className="px-7 pt-6 flex justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black uppercase tracking-widest">Maurya and Company</p>
        <p className="text-[10px] font-bold mt-1" style={{ color: "#facc15" }}>समस्या निवारण</p>

        <div className="mt-7">
          <p className="text-[8px] font-bold uppercase tracking-[3px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Membership Plan
          </p>
          <p className="text-[18px] font-black mt-1">FIRST 30 DAYS FREE</p>
          <p className="text-[11px] font-bold mt-1" style={{ color: "#facc15" }}>THEN INR 99 / MONTH</p>
        </div>

        <div className="mt-6">
          <p className="text-[7px] font-bold uppercase tracking-[2px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Open this URL
          </p>
          <p className="text-[9px] font-bold mt-1 break-all leading-tight" style={{ color: "#ffffff" }}>
            {subscriptionUrl}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-center">
        <div className="p-2 rounded-lg" style={{ backgroundColor: "#ffffff" }}>
          <QRCodeCanvas value={subscriptionUrl} size={104} level="M" marginSize={1} />
        </div>
        <p className="text-[7px] font-bold uppercase tracking-widest mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
          Scan for plans
        </p>
      </div>
    </div>

    <div
      className="absolute bottom-0 inset-x-0 h-9 px-7 flex items-center justify-between"
      style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
    >
      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
        Card: {cardNumber}
      </p>
      <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
        Cancel anytime
      </p>
    </div>
  </div>
));

IDCardBack.displayName = "IDCardBack";
export default IDCardBack;
