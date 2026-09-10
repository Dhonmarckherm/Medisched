"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LockIcon, ArrowLeftIcon, CheckCircleIcon } from "@/components/Icons";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Check for session, URL hash tokens, or PKCE code
  useEffect(() => {
    async function checkAuth() {
      // 1. Check for PKCE code in URL query (?code=xxx)
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          setHasSession(true);
          setChecking(false);
          // Clean the URL
          window.history.replaceState({}, "", "/reset-password");
          return;
        } else {
          setError("Invalid or expired reset link. Please request a new one.");
          setChecking(false);
          return;
        }
      }

      // 2. Check for tokens in URL hash (#access_token=xxx)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Supabase should auto-detect this, but let's help it
        const { error: sessionError } = await supabase.auth.getSession();
        if (!sessionError) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setHasSession(true);
            setChecking(false);
            window.history.replaceState({}, "", "/reset-password");
            return;
          }
        }
      }

      // 3. Check for existing session (from auth callback)
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
      setChecking(false);
    }

    checkAuth();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); setLoading(false); return; }
      setSuccess("Password reset successfully! Redirecting to login...");
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 2000);
    } catch { setError("An unexpected error occurred"); } finally { setLoading(false); }
  };

  // Show loading while checking session
  if (checking) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-[14px]">Loading...</p>
      </div>
    );
  }

  // If no session, show message to use forgot password
  if (!hasSession) {
    return (
      <div className="w-full min-h-screen flex flex-col lg:flex-row relative">
        <a href="/" className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white no-underline text-[13px] font-medium transition">
          <ArrowLeftIcon size={14} /> Back to Home
        </a>
        <div className="w-full lg:w-1/2 bg-primary text-white flex flex-col justify-center items-center p-12">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
            <LockIcon className="text-white" size={32} />
          </div>
          <h1 className="text-[36px] font-bold mb-3 text-center">Reset Password</h1>
          <p className="text-[16px] text-center opacity-80 max-w-[360px]">
            You need a reset link to change your password.
          </p>
        </div>
        <div className="w-full lg:w-1/2 flex justify-center items-center bg-white p-8">
          <div className="w-full max-w-[400px] text-center">
            <h2 className="text-[26px] font-bold text-[#1a1a2e] mb-2">No Reset Link</h2>
            <p className="text-gray-400 text-[14px] mb-8">
              To reset your password, you need to request a reset link via email first.
            </p>
            <a href="/forgot-password"
              className="inline-block py-3 px-8 bg-primary text-white rounded-lg text-[14px] font-medium no-underline hover:bg-primary-hover transition">
              Request Reset Link
            </a>
            <p className="mt-5 text-[13px]">
              <a href="/login" className="text-primary no-underline font-medium inline-flex items-center gap-1">
                <ArrowLeftIcon size={14} /> Back to Login
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row relative">
      <a href="/" className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white no-underline text-[13px] font-medium transition">
        <ArrowLeftIcon size={14} /> Back to Home
      </a>

      {/* Left Panel */}
      <div className="w-full lg:w-1/2 bg-primary text-white flex flex-col justify-center items-center p-12">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
          <LockIcon className="text-white" size={32} />
        </div>
        <h1 className="text-[36px] font-bold mb-3 text-center">Set New Password</h1>
        <p className="text-[16px] text-center opacity-80 max-w-[360px]">
          Enter your new password below to complete the reset.
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-white p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold text-[#1a1a2e] mb-2">Create New Password</h2>
          <p className="text-gray-400 text-[14px] mb-8">Choose a strong password to secure your account</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-[14px] border border-red-100">{error}</div>}
          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-lg mb-5 text-[14px] border border-emerald-100 flex items-start gap-3">
              <CheckCircleIcon size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1 m-0">{success}</p>
                <p className="text-[13px] text-emerald-500 m-0">You can now log in with your new password.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">New Password</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <LockIcon className="text-gray-400 mr-2" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Min 6 characters" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Confirm New Password</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <LockIcon className="text-gray-400 mr-2" size={18} />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Re-enter password" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white border-none rounded-lg cursor-pointer text-[14px] font-medium mt-6 hover:bg-primary-hover transition disabled:opacity-50">
            {loading ? "Resetting..." : "Reset Password"}
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
