import { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import IDCard from "./components/IDCard";
import PersonDetailView from "./components/PersonDetailView";

interface PersonData {
  name: string;
  phone: string;
  photo: string;
  idNumber: string;
  dob: string;
  address: string;
}

// Compact Encoding (Only name, phone, idNumber for QR scan)
function encodeData(data: Partial<PersonData>): string {
  const compact = `${data.name}|${data.phone}|${data.idNumber}`;
  return btoa(encodeURIComponent(compact)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Decoding
function decodeData(encoded: string): any {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const decoded = decodeURIComponent(atob(base64));
    const [name, phone, idNumber] = decoded.split("|");
    return { name, phone, idNumber };
  } catch (e) {
    return null;
  }
}

export default function App() {
  const [viewData, setViewData] = useState<any>(null);
  const [formData, setFormData] = useState<PersonData>({ 
    name: "", 
    phone: "", 
    photo: "", 
    idNumber: "",
    dob: "",
    address: ""
  });
  const [generatedData, setGeneratedData] = useState<PersonData | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  const cardRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleRoute = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#/v/")) {
        const encoded = hash.split("#/v/")[1];
        if (encoded) {
          const decoded = decodeData(encoded);
          if (decoded) setViewData(decoded);
        }
      } else {
        setViewData(null);
      }
    };
    handleRoute();
    window.addEventListener("hashchange", handleRoute);
    return () => window.removeEventListener("hashchange", handleRoute);
  }, []);

  if (viewData) {
    return <PersonDetailView data={viewData} />;
  }

  const handleGenerate = () => {
    if (!formData.name || !formData.phone) {
      alert("Please fill name and phone");
      return;
    }
    const idNumber = "ID-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedData({ ...formData, idNumber });
    setActiveTab("preview");
  };

  const getQrUrl = (data: Partial<PersonData>) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/v/${encodeData(data)}`;
  };

  const updateGeneratedData = (field: keyof PersonData, value: string) => {
    setGeneratedData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-amber-500/30">
      {/* App Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-black shadow-lg shadow-amber-500/20">ID</div>
            <span className="font-black text-lg tracking-tighter uppercase">Maurya Generator</span>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab("form")}
              className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "form" ? "bg-amber-500 text-black" : "text-white/40"}`}
            >
              FORM
            </button>
            <button 
              onClick={() => setActiveTab("preview")}
              className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "preview" ? "bg-amber-500 text-black" : "text-white/40"}`}
            >
              PREVIEW
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 sm:p-10">
        {activeTab === "form" ? (
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-12">
            <div className="mb-10">
              <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Maurya and Company</h2>
              <p className="text-amber-500 text-sm font-bold uppercase tracking-widest">समस्या निवारण</p>
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Full Name</label>
                  <input 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-500/50 font-bold"
                    placeholder="Enter name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Phone Number</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-500/50 font-bold"
                    placeholder="Enter number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Date of Birth</label>
                  <input 
                    type="date"
                    value={formData.dob}
                    onChange={e => setFormData({...formData, dob: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-500/50 font-bold [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Address</label>
                  <input 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-500/50 font-bold"
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl flex flex-col sm:flex-row items-center gap-8 hover:bg-white/5 transition-all">
                <div className="w-24 h-32 bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <svg viewBox="0 0 24 24" className="w-10 h-10 text-white/10" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>}
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-black text-lg mb-1">Passport Photo</p>
                  <p className="text-xs text-white/30 font-bold mb-4">This will show on ID card, but NOT on QR scan page.</p>
                  <label className="cursor-pointer bg-white text-black text-[10px] font-black uppercase tracking-[3px] px-6 py-3 rounded-xl inline-block hover:scale-105 active:scale-95 transition-all">
                    Select Image
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData({...formData, photo: reader.result as string});
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                className="w-full bg-amber-500 text-black font-black py-5 rounded-[2rem] text-lg hover:bg-amber-400 hover:scale-[1.01] transition-all shadow-2xl shadow-amber-500/20"
              >
                GENERATE ID & QR
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {generatedData ? (
              <div className="grid lg:grid-cols-1 gap-10">
                {/* Editable QR Record */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 sm:p-10">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-[5px]">QR Scan Page</span>
                      <h2 className="text-2xl font-black uppercase tracking-tight mt-2">Editable Display Details</h2>
                    </div>
                    <button
                      onClick={() => window.open(getQrUrl(generatedData), "_blank", "noopener,noreferrer")}
                      className="bg-amber-500 text-black font-black uppercase tracking-[3px] px-6 py-3 rounded-2xl hover:bg-amber-400 transition-all text-[10px]"
                    >
                      Open Scan Page
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Name shown after scan</label>
                      <input
                        value={generatedData.name}
                        onChange={e => updateGeneratedData("name", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-500/50 font-bold"
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Number shown after scan</label>
                      <input
                        type="tel"
                        value={generatedData.phone}
                        onChange={e => updateGeneratedData("phone", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-500/50 font-bold"
                        placeholder="Enter number"
                      />
                    </div>
                  </div>

                  <div className="mt-6 bg-black/20 border border-white/10 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[3px] mb-2">Scan URL</p>
                    <p className="text-xs text-white/60 break-all font-mono">{getQrUrl(generatedData)}</p>
                  </div>
                </div>

                {/* ID Card Display */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[5px] mb-10">Digital ID Card</span>
                  <div className="scale-[0.6] sm:scale-100 origin-center">
                    <IDCard ref={cardRef} data={generatedData} />
                  </div>
                  <button 
                    onClick={() => {
                      html2canvas(cardRef.current!, { scale: 2 }).then(canvas => {
                        const link = document.createElement("a");
                        link.download = `card-${generatedData.name}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                      });
                    }}
                    className="mt-12 bg-white text-black font-black uppercase tracking-[3px] px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl"
                  >
                    Download ID Card
                  </button>
                </div>

                {/* QR Section */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[5px] mb-10">Verification QR</span>
                  <div className="bg-white p-8 rounded-[3rem] shadow-2xl" ref={qrRef}>
                    <QRCodeCanvas value={getQrUrl(generatedData)} size={240} level="L" marginSize={2} />
                  </div>
                  <p className="text-white/30 text-[10px] font-bold mt-6 tracking-widest uppercase italic">Scan opens a read-only page with this Name & Phone</p>
                  <button 
                    onClick={() => {
                      const canvas = qrRef.current!.querySelector("canvas");
                      const link = document.createElement("a");
                      link.download = `qr-${generatedData.name}.png`;
                      link.href = canvas!.toDataURL();
                      link.click();
                    }}
                    className="mt-8 bg-white text-black font-black uppercase tracking-[3px] px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl"
                  >
                    Download QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-32 opacity-10">
                <p className="font-black text-6xl tracking-tighter italic uppercase">No Card Ready</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
