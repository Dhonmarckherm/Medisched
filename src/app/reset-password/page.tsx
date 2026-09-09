"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailIcon, LockIcon, IdCardIcon, HospitalIcon, ArrowLeftIcon } from "@/components/Icons";

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({ email: "", idNumber: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    if (formData.newPassword.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, id_number: formData.idNumber, new_password: formData.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to reset password"); setLoading(false); return; }
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch { setError("An unexpected error occurred"); } finally { setLoading(false); }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="w-full lg:w-1/2 bg-primary text-white flex flex-col justify-center items-center p-12">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
          <LockIcon className="text-white" size={32} />
        </div>
        <h1 className="text-[36px] font-bold mb-3 text-center">Reset Password</h1>
        <p className="text-[16px] text-center opacity-80 max-w-[360px]">
          Enter your credentials to reset your password and regain access to your account.
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-white p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold text-[#1a1a2e] mb-2">Reset Your Password</h2>
          <p className="text-gray-400 text-[14px] mb-8">We&apos;ll help you recover your account</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-[14px] border border-red-100">{error}</div>}
          {success && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg mb-5 text-[14px] border border-emerald-100">{success}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Email</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3">
                <MailIcon className="text-gray-400 mr-2" size={18} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="you@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">ID Number</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3">
                <IdCardIcon className="text-gray-400 mr-2" size={18} />
                <input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} required
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Your ID number" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">New Password</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3">
                <LockIcon className="text-gray-400 mr-2" size={18} />
                <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required minLength={6}
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Min 6 characters" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Confirm New Password</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3">
                <LockIcon className="text-gray-400 mr-2" size={18} />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6}
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Re-enter password" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white border-none rounded-lg cursor-pointer text-[14px] font-medium mt-6 hover:bg-primary-hover transition disabled:opacity-50">
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <p className="mt-5 text-center text-[13px]">
            <Link href="/login" className="text-primary no-underline font-medium inline-flex items-center gap-1">
              <ArrowLeftIcon size={14} /> Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
