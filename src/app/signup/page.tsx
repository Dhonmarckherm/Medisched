"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    idNumber: "",
    password: "",
    confirmPassword: "",
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
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName || null,
          email: formData.email,
          id_number: formData.idNumber,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
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
        <div className="text-[80px] mb-6">🏥</div>
        <h1 className="text-[45px] font-bold mb-4 text-center">Join Us Today</h1>
        <p className="text-[18px] text-center mb-10 opacity-90 max-w-[400px]">
          Create your account to start scheduling appointments and requesting certificates.
        </p>
        <div className="text-[60px]">📋</div>
      </div>

      {/* Right Panel - White */}
      <div className="auth-right w-full lg:w-1/2 flex justify-center items-center bg-white p-5">
        <form onSubmit={handleSubmit} className="w-full max-w-[420px] fade-in">
          <h2 className="text-center text-[30px] font-bold text-[#222] mb-8">
            Create Account
          </h2>

          {error && (
            <div className="bg-[#f8d7da] text-[#842029] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#dc3545]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
              <span className="text-primary text-[18px] mr-2">👤</span>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="First Name *" />
            </div>
            <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
              <span className="text-primary text-[18px] mr-2">👤</span>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="Last Name *" />
            </div>
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">👤</span>
            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange}
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="Middle Name" />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">📧</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="Email Address *" />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">🆔</span>
            <input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} required
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="ID Number *" />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">🔒</span>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="Password *" />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">🔒</span>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6}
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]" placeholder="Confirm Password *" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn w-full py-4 bg-primary text-white border-none rounded-[10px] cursor-pointer text-[16px] font-semibold hover:bg-primary-hover transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="mt-5 text-center text-[14px] text-[#555]">
            Already have an account?{" "}
            <Link href="/login" className="text-primary no-underline font-semibold">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
