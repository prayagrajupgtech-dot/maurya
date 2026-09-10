import { useState, useRef, useEffect, useCallback } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise<boolean>(resolve => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Step = "form" | "otp" | "checkout";

export default function PlansPage() {
  const [customer, setCustomer] = useState({ email: "", name: "", phone: "" });
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpMessage, setOtpMessage] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const validateForm = useCallback((): string | null => {
    if (!customer.name.trim() || customer.name.trim().length < 3) {
      return "Please enter your full name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return "Please enter a valid email address.";
    }
    if (!/^[6-9]\d{9}$/.test(customer.phone.replace(/\D/g, ""))) {
      return "Please enter a valid 10-digit mobile number.";
    }
    if (!accepted) {
      return "Please accept the recurring payment terms.";
    }
    return null;
  }, [customer, accepted]);

  const sendOtp = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSendingOtp(true);
    setMessage("");
    setOtpMessage("");

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customer.email.trim().toLowerCase() })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send verification code.");
      }
      setStep("otp");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpMessage("");

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      verifyOtpCode();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    // Focus appropriate input
    const focusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const verifyOtpCode = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setOtpMessage("Please enter the complete 6-digit code.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpMessage("");

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customer.email.trim().toLowerCase(),
          otp: otpString
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Verification failed.");
      }

      // Email verified - proceed to Razorpay
      setStep("checkout");
      startRazorpayCheckout();
    } catch (error) {
      setOtpMessage(error instanceof Error ? error.message : "Verification failed.");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpMessage("");
    setIsSendingOtp(true);

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customer.email.trim().toLowerCase() })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to resend code.");
      }
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (error) {
      setOtpMessage(error instanceof Error ? error.message : "Failed to resend code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const startRazorpayCheckout = async () => {
    setIsStarting(true);
    setMessage("");

    try {
      const checkoutLoaded = await loadRazorpayCheckout();
      if (!checkoutLoaded || !window.Razorpay) throw new Error("Razorpay Checkout could not be loaded.");

      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start checkout.");

      const checkout = new window.Razorpay({
        description: "First 30 days free, then INR 99 per month",
        handler: async (payment: Record<string, string>) => {
          const verifyResponse = await fetch("/api/verify-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment)
          });
          const verification = await verifyResponse.json();
          if (!verifyResponse.ok) {
            setMessage(verification.error || "Payment verification failed.");
            setStep("form");
            return;
          }
          setSuccess(true);
          setMessage("Subscription authorization verified. Your 30-day free period has started.");
        },
        key: result.keyId,
        modal: {
          ondismiss: () => {
            setMessage("Checkout was closed before completion.");
            setStep("form");
          }
        },
        name: "Maurya and Company",
        prefill: {
          contact: customer.phone,
          email: customer.email,
          name: customer.name
        },
        subscription_id: result.subscriptionId,
        theme: { color: "#dc2626" }
      });
      checkout.on("payment.failed", response => {
        setMessage(response.error?.description || "Payment authorization failed.");
        setStep("form");
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start checkout.");
      setStep("form");
    } finally {
      setIsStarting(false);
    }
  };

  const otpString = otp.join("");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="bg-[#111827] text-white border-b-4 border-red-600">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div>
            <p className="text-lg font-black uppercase">Maurya and Company</p>
            <p className="text-sm font-bold text-amber-400">समस्या निवारण</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-black uppercase tracking-[3px] text-red-600">Membership</p>
            <h1 className="text-3xl sm:text-4xl font-black mt-3">One simple monthly plan</h1>
            <p className="text-sm text-slate-500 mt-3">Authorize once and start with a 30-day free period.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-[0_20px_60px_rgba(15,23,42,0.1)] overflow-hidden">
            <div className="bg-red-600 text-white px-6 py-3 text-center text-xs font-black uppercase tracking-widest">
              First 30 days free
            </div>
            <div className="p-7 sm:p-9">
              <div className="flex items-end justify-center gap-2 mb-8">
                <span className="text-5xl font-black">₹99</span>
                <span className="text-sm font-bold text-slate-400 mb-2">/ month after trial</span>
              </div>

              {success ? (
                <div className="border border-emerald-200 bg-emerald-50 p-6 text-center rounded-lg">
                  <p className="font-black text-emerald-800">Subscription authorized</p>
                  <p className="text-sm text-emerald-700 mt-2">{message}</p>
                </div>
              ) : step === "otp" ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="font-black text-lg">Verify your email</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      We've sent a 6-digit verification code to<br />
                      <span className="font-bold text-slate-700">{customer.email.trim().toLowerCase()}</span>
                    </p>
                  </div>

                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { otpInputRefs.current[index] = el; }}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-11 h-12 text-center text-lg font-bold border border-slate-300 rounded-md outline-none focus:border-red-500"
                        disabled={isVerifyingOtp}
                      />
                    ))}
                  </div>

                  <button
                    onClick={verifyOtpCode}
                    disabled={isVerifyingOtp || otpString.length !== 6}
                    className="w-full bg-[#111827] text-white py-4 rounded-md font-black uppercase tracking-widest disabled:cursor-wait disabled:opacity-60"
                  >
                    {isVerifyingOtp ? "Verifying..." : "Verify Email"}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isSendingOtp}
                      className="text-sm text-slate-500 hover:text-red-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : isSendingOtp
                          ? "Sending..."
                          : "Resend OTP"}
                    </button>
                  </div>

                  <button
                    onClick={() => { setStep("form"); setOtpMessage(""); setOtp(["", "", "", "", "", ""]); }}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 py-2"
                  >
                    ← Back to form
                  </button>

                  {otpMessage && <p className="text-sm text-center font-bold text-red-600">{otpMessage}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    value={customer.name}
                    onChange={event => setCustomer({ ...customer, name: event.target.value })}
                    placeholder="Full name"
                    disabled={isStarting}
                    className="w-full border border-slate-300 px-4 py-3 rounded-md outline-none focus:border-red-500"
                  />
                  <input
                    type="email"
                    value={customer.email}
                    onChange={event => setCustomer({ ...customer, email: event.target.value })}
                    placeholder="Email address"
                    disabled={isStarting}
                    className="w-full border border-slate-300 px-4 py-3 rounded-md outline-none focus:border-red-500"
                  />
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={event => setCustomer({ ...customer, phone: event.target.value })}
                    placeholder="10-digit mobile number"
                    disabled={isStarting}
                    className="w-full border border-slate-300 px-4 py-3 rounded-md outline-none focus:border-red-500"
                  />

                  <label className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={event => setAccepted(event.target.checked)}
                      disabled={isStarting}
                      className="mt-0.5 w-4 h-4 accent-red-600"
                    />
                    <span>
                      I authorize recurring billing. The first 30 days are free; after that, ₹99 is charged monthly
                      for up to 60 billing cycles unless cancelled. Razorpay or the bank may perform a mandate
                      authorization transaction.
                    </span>
                  </label>

                  <button
                    onClick={sendOtp}
                    disabled={isStarting || isSendingOtp}
                    className="w-full bg-[#111827] text-white py-4 rounded-md font-black uppercase tracking-widest disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSendingOtp ? "Sending code..." : "Start free month"}
                  </button>
                  {message && <p className="text-sm text-center font-bold text-red-600">{message}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 leading-relaxed">
            Payments and recurring mandate authorization are processed by Razorpay. Test the complete cancellation,
            webhook, refund, privacy, and customer-support workflow before enabling live credentials.
          </div>
        </div>
      </main>
    </div>
  );
}
