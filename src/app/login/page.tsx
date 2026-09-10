"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailIcon, LockIcon, IdCardIcon, HospitalIcon, ArrowLeftIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const redirectError = searchParams.get("error");
  const registered = searchParams.get("registered");

  // Show toast for redirect errors and registration success
  useEffect(() => {
    if (redirectError) {
      addToast("error", redirectError);
    }
    if (registered) {
      addToast("success", "Account created! Please sign in.");
    }
  }, [redirectError, registered, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, id_number: idNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast("error", data.error || "Login failed");
        setLoading(false);
        return;
      }

      addToast("success", "Login successful! Redirecting...");

      if (data.user.role === "admin" || data.user.role === "nurse") {
        setTimeout(() => router.push("/admin"), 800);
      } else {
        setTimeout(() => router.push("/dashboard"), 800);
      }
    } catch {
      addToast("error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row relative">
      {/* Back to Home */}
      <Link href="/" className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white no-underline text-[13px] font-medium transition">
        <ArrowLeftIcon size={14} /> Back to Home
      </Link>

      {/* Left Panel */}
      <div className="w-full lg:w-1/2 bg-primary text-white flex flex-col justify-center items-center p-12">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
          <HospitalIcon className="text-white" size={32} />
        </div>
        <h1 className="text-[36px] font-bold mb-3 text-center">MEDISCHED CERT</h1>
        <p className="text-[16px] text-center opacity-80 max-w-[360px]">
          Medical Scheduling and Certification Request System
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-white p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold text-[#1a1a2e] mb-2">Welcome back</h2>
          <p className="text-gray-400 text-[14px] mb-8">Sign in to your account to continue</p>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Email</label>
              <div className="flex items-center border border-gray-200 rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <MailIcon className="text-gray-400 mr-2 flex-shrink-0" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="you@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">ID Number</label>
              <div className="flex items-center border border-gray-200 rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <IdCardIcon className="text-gray-400 mr-2 flex-shrink-0" size={18} />
                <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required
                  className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="Your ID number" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Password</label>
              <div className="flex items-center border border-gray-200 rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <LockIcon className="text-gray-400 mr-2 flex-shrink-0" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="Enter password" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 text-[13px]">
            <label className="flex items-center gap-2 text-gray-500">
              <input type="checkbox" className="accent-primary rounded" /> Remember me
            </label>
            <Link href="/reset-password" className="text-primary no-underline font-medium">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white border-none rounded-lg cursor-pointer text-[14px] font-medium mt-6 hover:bg-primary-hover transition disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="mt-5 text-center text-[13px] text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary no-underline font-medium">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
