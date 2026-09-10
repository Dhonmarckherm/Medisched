"use client";

import { useState } from "react";
import { MailIcon, LockIcon, HospitalIcon, ArrowLeftIcon, CheckCircleIcon } from "@/components/Icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send reset link"); setLoading(false); return; }
      setSuccess("Password reset link sent! Check your email inbox.");
    } catch { setError("An unexpected error occurred"); } finally { setLoading(false); }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row relative">
      {/* Back to Home */}
      <a href="/" className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white no-underline text-[13px] font-medium transition">
        <ArrowLeftIcon size={14} /> Back to Home
      </a>

      {/* Left Panel */}
      <div className="w-full lg:w-1/2 bg-primary text-white flex flex-col justify-center items-center p-12">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
          <LockIcon className="text-white" size={32} />
        </div>
        <h1 className="text-[36px] font-bold mb-3 text-center">Forgot Password?</h1>
        <p className="text-[16px] text-center opacity-80 max-w-[360px]">
          No worries! Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-white p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold text-[#1a1a2e] mb-2">Reset Your Password</h2>
          <p className="text-gray-400 text-[14px] mb-8">We&apos;ll send a reset link to your email</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-[14px] border border-red-100">{error}</div>}
          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-lg mb-5 text-[14px] border border-emerald-100 flex items-start gap-3">
              <CheckCircleIcon size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1 m-0">{success}</p>
                <p className="text-[13px] text-emerald-500 m-0">Check your spam folder if you don&apos;t see it in your inbox.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Email Address</label>
            <div className="flex items-center border border-gray-200 rounded-lg px-3">
              <MailIcon className="text-gray-400 mr-2" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="you@email.com" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white border-none rounded-lg cursor-pointer text-[14px] font-medium mt-6 hover:bg-primary-hover transition disabled:opacity-50">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="mt-5 text-center text-[13px]">
            <a href="/login" className="text-primary no-underline font-medium inline-flex items-center gap-1">
              <ArrowLeftIcon size={14} /> Back to Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
