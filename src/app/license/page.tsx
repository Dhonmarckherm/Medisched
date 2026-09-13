"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LockIcon, KeyIcon, CheckCircleIcon } from "@/components/Icons";

export default function LicensePage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Check if already activated
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/license");
        const data = await res.json();
        if (data.activated) {
          router.push("/login");
        }
      } catch {
        // Not activated yet
      }
    }
    checkStatus();
  }, [router]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: licenseKey.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Invalid license key");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#84B179]/10 via-white to-[#84B179]/5 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#111] mb-2">System Activated!</h1>
          <p className="text-gray-500 text-sm">
            MEDISCHED CERT has been successfully activated. Redirecting to login...
          </p>
          <div className="mt-6 w-48 h-1 bg-gray-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[#84B179] rounded-full animate-[grow_2s_ease-in-out]" 
              style={{ animation: "grow 2s ease-in-out forwards" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#84B179]/10 via-white to-[#84B179]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#84B179]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LockIcon size={28} className="text-[#84B179]" />
          </div>
          <h1 className="text-2xl font-bold text-[#111] mb-1">MEDISCHED CERT</h1>
          <p className="text-gray-400 text-sm">License Activation Required</p>
        </div>

        {/* Activation Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-50">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <KeyIcon size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#111] m-0">Activate Your License</h2>
              <p className="text-[11px] text-gray-400 m-0 mt-0.5">
                Enter the license key provided by the developer
              </p>
            </div>
          </div>

          <form onSubmit={handleActivate}>
            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                License Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  setError("");
                }}
                placeholder="MSCHED-XXXX-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] text-[#111] placeholder:text-gray-300 focus:outline-none focus:border-[#84B179] focus:ring-1 focus:ring-[#84B179]/20 transition font-mono tracking-wider uppercase"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                <p className="text-[12px] text-red-600 m-0">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !licenseKey.trim()}
              className="w-full py-2.5 bg-[#84B179] hover:bg-[#73a068] text-white text-[13px] font-semibold rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Activating...
                </span>
              ) : (
                "Activate System"
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-5 pt-4 border-t border-gray-50">
            <div className="bg-blue-50/50 rounded-lg p-3">
              <p className="text-[11px] text-blue-600 m-0 leading-relaxed">
                <strong>Need a license key?</strong> This system requires payment to activate. Please settle your payment with the developer first to receive your activation key. The system cannot be used until the license is activated.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-300 mt-6">
          MEDISCHED CERT &copy; {new Date().getFullYear()} &middot; ISPSC Candon Campus
        </p>
      </div>
    </div>
  );
}
