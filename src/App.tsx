import { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import IDCard from "./components/IDCard";
import IDCardBack from "./components/IDCardBack";
import PersonDetailView from "./components/PersonDetailView";
import PlansPage from "./components/PlansPage";

interface PersonData {
  name: string;
  phone: string;
  photo: string;
  signature: string;
  idNumber: string;
  dob: string;
  address: string;
}

interface GeneratedPersonData extends PersonData {
  editToken: string;
  recordId: string;
}

interface VerificationData {
  databaseVerified: boolean;
  idNumber: string;
  name: string;
  phone: string;
  status: "active" | "expired" | "blocked" | "legacy";
}

type ValidationErrors = Partial<Record<"name" | "phone" | "dob" | "address", string>>;

// Decodes QR codes generated before database verification was introduced.
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

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

function validatePersonData(data: PersonData): ValidationErrors {
  const errors: ValidationErrors = {};
  const name = data.name.trim();
  const phone = normalizePhone(data.phone);
  const address = data.address.trim();

  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length < 3) {
    errors.name = "Name must be at least 3 characters.";
  }

  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!/^[6-9]\d{9}$/.test(phone)) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }

  if (!data.dob) {
    errors.dob = "Date of birth is required.";
  } else {
    const dob = new Date(`${data.dob}T00:00:00`);
    const today = new Date();
    const oldestAllowed = new Date();
    oldestAllowed.setFullYear(today.getFullYear() - 120);

    if (Number.isNaN(dob.getTime())) {
      errors.dob = "Enter a valid date of birth.";
    } else if (dob > today) {
      errors.dob = "Date of birth cannot be in the future.";
    } else if (dob < oldestAllowed) {
      errors.dob = "Date of birth looks too old.";
    }
  }

  if (!address) {
    errors.address = "Home address is required.";
  } else if (address.length < 10) {
    errors.address = "Enter a complete home address.";
  } else if (!/[a-zA-Z]/.test(address) || !/\d/.test(address)) {
    errors.address = "Address should include house/street details and area.";
  }

  return errors;
}

export default function App() {
  const [viewData, setViewData] = useState<VerificationData | null>(null);
  const [verificationState, setVerificationState] = useState<"idle" | "loading" | "not-found" | "error">("idle");
  const [isPlansPage, setIsPlansPage] = useState(false);
  const [formData, setFormData] = useState<PersonData>({ 
    name: "", 
    phone: "", 
    photo: "", 
    signature: "",
    idNumber: "",
    dob: "",
    address: ""
  });
  const [generatedData, setGeneratedData] = useState<GeneratedPersonData | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [downloadingSide, setDownloadingSide] = useState<"front" | "back" | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [formError, setFormError] = useState("");
  const [recordMessage, setRecordMessage] = useState("");

  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let requestNumber = 0;

    const handleRoute = async () => {
      const currentRequest = ++requestNumber;
      const hash = window.location.hash;
      if (hash === "#/plans") {
        setIsPlansPage(true);
        setViewData(null);
        setVerificationState("idle");
      } else if (hash.startsWith("#/verify/")) {
        setIsPlansPage(false);
        const recordId = hash.split("#/verify/")[1];
        setViewData(null);
        setVerificationState("loading");

        try {
          const response = await fetch(`/.netlify/functions/verify-card?id=${encodeURIComponent(recordId)}`, {
            headers: { Accept: "application/json" }
          });
          const result = await response.json();
          if (currentRequest !== requestNumber) return;

          if (response.status === 404) {
            setVerificationState("not-found");
            return;
          }
          if (!response.ok) {
            setVerificationState("error");
            return;
          }

          setViewData({
            databaseVerified: true,
            idNumber: result.cardNumber,
            name: result.name,
            phone: result.phone,
            status: result.status
          });
          setVerificationState("idle");
        } catch {
          if (currentRequest === requestNumber) {
            setVerificationState("error");
          }
        }
      } else if (hash.startsWith("#/v/")) {
        setIsPlansPage(false);
        const encoded = hash.split("#/v/")[1];
        if (encoded) {
          const decoded = decodeData(encoded);
          if (decoded) {
            setViewData({ ...decoded, databaseVerified: false, status: "legacy" });
            setVerificationState("idle");
          }
        }
      } else {
        setIsPlansPage(false);
        setViewData(null);
        setVerificationState("idle");
      }
    };
    void handleRoute();
    window.addEventListener("hashchange", handleRoute);
    return () => {
      requestNumber += 1;
      window.removeEventListener("hashchange", handleRoute);
    };
  }, []);

  if (isPlansPage) {
    return <PlansPage />;
  }

  if (viewData) {
    return <PersonDetailView data={viewData} />;
  }

  if (verificationState !== "idle") {
    const messages = {
      error: ["Verification unavailable", "The verification service could not be reached. Please try again."],
      loading: ["Checking record", "Fetching the latest card status..."],
      "not-found": ["Record not found", "This QR code does not match an existing verification record."]
    };
    const [title, message] = messages[verificationState];
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center border border-white/10 bg-white/5 rounded-3xl p-10">
          <h1 className="text-2xl font-black uppercase">{title}</h1>
          <p className="mt-3 text-sm text-white/50">{message}</p>
          {verificationState !== "loading" && (
            <button
              onClick={() => {
                window.location.hash = "";
                window.location.reload();
              }}
              className="mt-8 bg-amber-500 text-black font-black uppercase text-xs tracking-widest px-6 py-3 rounded-xl"
            >
              Return Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    const validationErrors = validatePersonData(formData);
    setErrors(validationErrors);
    setFormError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsGenerating(true);
    const normalizedData = {
      ...formData,
      name: formData.name.trim(),
      phone: normalizePhone(formData.phone),
      address: formData.address.trim()
    };

    try {
      const response = await fetch("/.netlify/functions/create-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: normalizedData.address,
          dateOfBirth: normalizedData.dob,
          name: normalizedData.name,
          phone: normalizedData.phone
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not create the verification record.");
      }

      setGeneratedData({
        ...normalizedData,
        editToken: result.editToken,
        idNumber: result.cardNumber,
        recordId: result.id
      });
      setRecordMessage("");
      setActiveTab("preview");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create the verification record.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getQrUrl = (data: GeneratedPersonData) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/verify/${data.recordId}`;
  };

  const getSubscriptionUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/plans`;
  };

  const updateGeneratedData = (field: keyof PersonData, value: string) => {
    setGeneratedData(prev => prev ? { ...prev, [field]: value } : prev);
    setRecordMessage("");
  };

  const saveGeneratedDetails = async () => {
    if (!generatedData || isSavingRecord) return;

    const phone = normalizePhone(generatedData.phone);
    if (generatedData.name.trim().length < 3 || !/^[6-9]\d{9}$/.test(phone)) {
      setRecordMessage("Enter a valid name and 10-digit phone number.");
      return;
    }

    setIsSavingRecord(true);
    setRecordMessage("");
    try {
      const response = await fetch("/.netlify/functions/update-card", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editToken: generatedData.editToken,
          id: generatedData.recordId,
          name: generatedData.name.trim(),
          phone
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save changes.");
      setGeneratedData(prev => prev ? { ...prev, name: prev.name.trim(), phone } : prev);
      setRecordMessage("Scan details saved to the verification database.");
    } catch (error) {
      setRecordMessage(error instanceof Error ? error.message : "Could not save changes.");
    } finally {
      setIsSavingRecord(false);
    }
  };

  const downloadIdCard = async (side: "front" | "back") => {
    const cardElement = side === "front" ? frontCardRef.current : backCardRef.current;
    if (!cardElement || !generatedData || downloadingSide) return;

    setDownloadingSide(side);
    try {
      await document.fonts.ready;
      await Promise.all(
        Array.from(cardElement.querySelectorAll("img")).map(image =>
          image.complete ? Promise.resolve() : image.decode()
        )
      );

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        logging: false,
        scale: 2,
        useCORS: true
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error("Could not create ID card image.")), "image/png");
      });
      const objectUrl = URL.createObjectURL(blob);
      const safeName = generatedData.name.trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || "id";
      const link = document.createElement("a");
      link.download = `card-${safeName}-${side}.png`;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error("ID card download failed", error);
      window.alert("ID card download failed. Please try again.");
    } finally {
      setDownloadingSide(null);
    }
  };

  const updateFormData = (field: keyof PersonData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!prev[field as keyof ValidationErrors]) return prev;
      const next = { ...prev };
      delete next[field as keyof ValidationErrors];
      return next;
    });
  };

  const loadImageFile = (field: "photo" | "signature", file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image size must be 5 MB or less.");
      return;
    }

    setFormError("");
    const reader = new FileReader();
    reader.onloadend = () => updateFormData(field, reader.result as string);
    reader.readAsDataURL(file);
  };

  const fieldClassName = (field: keyof ValidationErrors) =>
    `w-full bg-white/5 border rounded-2xl px-5 py-4 outline-none focus:border-amber-500/50 font-bold ${
      errors[field] ? "border-red-500/70" : "border-white/10"
    }`;

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
                    onChange={e => updateFormData("name", e.target.value)}
                    className={fieldClassName("name")}
                    placeholder="Enter name"
                  />
                  {errors.name && <p className="text-xs font-bold text-red-300">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Phone Number</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => updateFormData("phone", e.target.value)}
                    className={fieldClassName("phone")}
                    placeholder="10-digit mobile number"
                  />
                  {errors.phone && <p className="text-xs font-bold text-red-300">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Date of Birth</label>
                  <input 
                    type="date"
                    value={formData.dob}
                    onChange={e => updateFormData("dob", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className={`${fieldClassName("dob")} [color-scheme:dark]`}
                  />
                  {errors.dob && <p className="text-xs font-bold text-red-300">{errors.dob}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={e => updateFormData("address", e.target.value)}
                    className={`${fieldClassName("address")} min-h-28 resize-none`}
                    placeholder="House no, street, city, state"
                  />
                  {errors.address && <p className="text-xs font-bold text-red-300">{errors.address}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center text-center gap-5 hover:bg-white/5 transition-all">
                  <div className="w-24 h-32 bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                    {formData.photo ? (
                      <img src={formData.photo} alt="Passport preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-10 h-10 text-white/10" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-lg mb-1">Passport Photo</p>
                    <p className="text-xs text-white/30 font-bold mb-4">Shown on the downloaded ID card.</p>
                    <label className="cursor-pointer bg-white text-black text-[10px] font-black uppercase tracking-[3px] px-6 py-3 rounded-xl inline-block hover:scale-105 active:scale-95 transition-all">
                      Select Photo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={event => loadImageFile("photo", event.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-6 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center text-center gap-5 hover:bg-white/5 transition-all">
                  <div className="w-40 h-20 bg-white rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-3">
                    {formData.signature ? (
                      <img src={formData.signature} alt="Signature preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-28 border-b-2 border-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-lg mb-1">Signature</p>
                    <p className="text-xs text-white/30 font-bold mb-4">Use a clear PNG, JPG, or WebP image.</p>
                    <label className="cursor-pointer bg-white text-black text-[10px] font-black uppercase tracking-[3px] px-6 py-3 rounded-xl inline-block hover:scale-105 active:scale-95 transition-all">
                      Select Signature
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={event => loadImageFile("signature", event.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-amber-500 text-black font-black py-5 rounded-[2rem] text-lg hover:bg-amber-400 hover:scale-[1.01] transition-all shadow-2xl shadow-amber-500/20 disabled:cursor-wait disabled:opacity-60"
              >
                {isGenerating ? "SAVING VERIFICATION RECORD..." : "GENERATE ID & QR"}
              </button>
              {formError && (
                <p className="text-center text-sm font-bold text-red-300">{formError}</p>
              )}
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

                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                      onClick={saveGeneratedDetails}
                      disabled={isSavingRecord}
                      className="bg-white text-black font-black uppercase tracking-[3px] px-6 py-3 rounded-2xl transition-all text-[10px] disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSavingRecord ? "Saving..." : "Save Scan Details"}
                    </button>
                    {recordMessage && (
                      <p className="text-xs font-bold text-white/60">{recordMessage}</p>
                    )}
                  </div>

                  <div className="mt-6 bg-black/20 border border-white/10 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[3px] mb-2">Scan URL</p>
                    <p className="text-xs text-white/60 break-all font-mono">{getQrUrl(generatedData)}</p>
                  </div>
                </div>

                {/* ID Card Display */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between gap-4 mb-10">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[5px]">Digital ID Card</span>
                    <button
                      onClick={() => setIsCardFlipped(value => !value)}
                      className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-[2px] px-4 py-2 rounded-xl"
                    >
                      Flip Card
                    </button>
                  </div>

                  <div className="w-[300px] h-[180px] sm:w-[500px] sm:h-[300px]">
                    <div className="w-[500px] h-[300px] scale-[0.6] sm:scale-100 origin-top-left" style={{ perspective: "1200px" }}>
                      <div
                        className="relative w-full h-full transition-transform duration-700"
                        style={{
                          transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                          transformStyle: "preserve-3d"
                        }}
                      >
                        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                          <IDCard ref={frontCardRef} data={generatedData} />
                        </div>
                        <div
                          className="absolute inset-0"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          <IDCardBack
                            ref={backCardRef}
                            cardNumber={generatedData.idNumber}
                            subscriptionUrl={getSubscriptionUrl()}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    Showing {isCardFlipped ? "back" : "front"} side
                  </p>
                  <div className="mt-7 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => downloadIdCard("front")}
                      disabled={downloadingSide !== null}
                      className="bg-white text-black font-black uppercase tracking-[2px] px-6 py-3 rounded-2xl transition-all disabled:cursor-wait disabled:opacity-60 text-[10px]"
                    >
                      {downloadingSide === "front" ? "Preparing..." : "Download Front"}
                    </button>
                    <button
                      onClick={() => downloadIdCard("back")}
                      disabled={downloadingSide !== null}
                      className="bg-white text-black font-black uppercase tracking-[2px] px-6 py-3 rounded-2xl transition-all disabled:cursor-wait disabled:opacity-60 text-[10px]"
                    >
                      {downloadingSide === "back" ? "Preparing..." : "Download Back"}
                    </button>
                  </div>
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
