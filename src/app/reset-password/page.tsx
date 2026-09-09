"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    email: "",
    idNumber: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          id_number: formData.idNumber,
          new_password: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container w-full min-h-screen flex flex-wrap">
      {/* Left Panel - Green */}
      <div className="auth-left w-full lg:w-1/2 bg-primary text-white flex flex-col justify-center items-center p-[50px]">
        <div className="text-[80px] mb-6">🔐</div>
        <h1 className="text-[45px] font-bold mb-4 text-center">Reset Password</h1>
        <p className="text-[18px] text-center mb-10 opacity-90 max-w-[400px]">
          Enter your credentials to reset your password and regain access to your account.
        </p>
        <div className="text-[60px]">🔑</div>
      </div>

      {/* Right Panel - White */}
      <div className="auth-right w-full lg:w-1/2 flex justify-center items-center bg-white p-5">
        <form onSubmit={handleSubmit} className="w-full max-w-[420px] fade-in">
          <h2 className="text-center text-[30px] font-bold text-[#222] mb-8">
            Reset Your Password
          </h2>

          {error && (
            <div className="bg-[#f8d7da] text-[#842029] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#dc3545]">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[#d1e7dd] text-[#0f5132] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#198754]">
              {success}
            </div>
          )}

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">📧</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="Email Address" />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">🆔</span>
            <input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} required
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="ID Number" />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">🔒</span>
            <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required minLength={6}
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="New Password" />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">🔒</span>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6}
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="Confirm New Password" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn w-full py-4 bg-primary text-white border-none rounded-[10px] cursor-pointer text-[16px] font-semibold hover:bg-primary-hover transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <p className="mt-5 text-center text-[14px] text-[#555]">
            <Link href="/login" className="text-primary no-underline font-semibold">
              ← Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
