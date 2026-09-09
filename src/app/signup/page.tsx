"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MailIcon, LockIcon, UserIcon, IdCardIcon, HospitalIcon, ArrowLeftIcon } from "@/components/Icons";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", middleName: "", email: "", idNumber: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName, last_name: formData.lastName,
          middle_name: formData.middleName || null, email: formData.email,
          id_number: formData.idNumber, password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      router.push("/login?registered=true");
    } catch { setError("An unexpected error occurred"); } finally { setLoading(false); }
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
        <h1 className="text-[36px] font-bold mb-3 text-center">Join Us Today</h1>
        <p className="text-[16px] text-center opacity-80 max-w-[360px]">
          Create your account to start scheduling appointments and requesting certificates.
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-white p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold text-[#1a1a2e] mb-2">Create Account</h2>
          <p className="text-gray-400 text-[14px] mb-8">Fill in your details to get started</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-[14px] border border-red-100">{error}</div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">First Name</label>
                <div className="flex items-center border border-gray-200 rounded-lg px-3">
                  <UserIcon className="text-gray-400 mr-2" size={18} />
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                    className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="First" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Last Name</label>
                <div className="flex items-center border border-gray-200 rounded-lg px-3">
                  <UserIcon className="text-gray-400 mr-2" size={18} />
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                    className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Last" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Middle Name</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3">
                <UserIcon className="text-gray-400 mr-2" size={18} />
                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange}
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Middle (optional)" />
              </div>
            </div>

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
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Password</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3">
                <LockIcon className="text-gray-400 mr-2" size={18} />
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Min 6 characters" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Confirm Password</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3">
                <LockIcon className="text-gray-400 mr-2" size={18} />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6}
                  className="w-full py-3 border-none outline-none text-[14px] bg-transparent" placeholder="Re-enter password" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white border-none rounded-lg cursor-pointer text-[14px] font-medium mt-6 hover:bg-primary-hover transition disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="mt-5 text-center text-[13px] text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-primary no-underline font-medium">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
