"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill, Phone, KeyRound, Zap, ChevronRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError("Please enter a phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
      } else {
        setStep("otp");
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (overridePhone?: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: overridePhone || phone,
          otp: overridePhone ? undefined : otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }
      // Persist session
      localStorage.setItem("auramed_session_token", data.sessionToken);
      localStorage.setItem("auramed_current_user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => handleVerifyOtp("demo");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/30 mb-4">
            <Pill className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">AuraMed</h1>
          <p className="text-sm text-slate-500 mt-1">Caregiver-first pharmacy</p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          {step === "phone" ? (
            <>
              <h2 className="text-lg font-bold text-slate-900">Sign in</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your phone number to receive an OTP.
              </p>

              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-3 text-xs text-red-600 font-medium">{error}</p>
              )}

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 text-sm font-bold shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Send OTP</span>
                {!loading && <ChevronRight className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900">Enter OTP</h2>
              <p className="text-xs text-slate-500 mt-1">
                Sent to <span className="font-semibold text-slate-700">{phone}</span>. Use <code className="bg-amber-50 text-amber-700 px-1 rounded">123456</code> for demo.
              </p>

              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  6-Digit OTP
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm font-mono tracking-widest focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-3 text-xs text-red-600 font-medium">{error}</p>
              )}

              <button
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.length !== 6}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 text-sm font-bold shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Verify & Sign in</span>
              </button>

              <button
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                className="mt-3 w-full text-xs text-slate-500 hover:text-slate-700 font-semibold"
              >
                ← Change phone number
              </button>
            </>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-700 px-4 py-3 text-sm font-bold transition-all disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            <span>Demo Mode (Skip Login)</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Demo OTP is <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">123456</code> — phone "demo" bypasses all checks.
        </p>
      </div>
    </div>
  );
}
