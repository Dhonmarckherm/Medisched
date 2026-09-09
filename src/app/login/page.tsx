"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("id_number", idNumber)
        .single();

      if (userError || !user) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, userId: user.id }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      if (user.active_status !== "active") {
        setError("Your account has been deactivated. Contact admin.");
        setLoading(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        const sessionRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, id_number: idNumber, password }),
        });
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok) {
          setError(sessionData.error || "Login failed");
          setLoading(false);
          return;
        }
      }

      if (user.role === "admin" || user.role === "nurse") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
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
        <h1 className="text-[45px] font-bold mb-4 text-center">MEDISCHED CERT</h1>
        <p className="text-[18px] text-center mb-10 opacity-90 max-w-[400px]">
          Medical Scheduling and Certification Request System
        </p>
        <div className="text-[60px]">🩺</div>
      </div>

      {/* Right Panel - White */}
      <div className="auth-right w-full lg:w-1/2 flex justify-center items-center bg-white p-5">
        <form onSubmit={handleSubmit} className="w-full max-w-[420px] fade-in">
          <h2 className="text-center text-[30px] font-bold text-[#222] mb-8">
            Welcome Back
          </h2>

          {(error || redirectError) && (
            <div className="bg-[#f8d7da] text-[#842029] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#dc3545]">
              {error || redirectError}
            </div>
          )}

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">📧</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]"
              placeholder="Email Address"
            />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">🆔</span>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]"
              placeholder="ID Number"
            />
          </div>

          <div className="input-group flex items-center border border-[#ddd] rounded-[10px] mb-4 px-4">
            <span className="text-primary text-[18px] mr-2">🔒</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full py-3.5 border-none outline-none text-[15px] font-[Poppins]"
              placeholder="Password"
            />
          </div>

          <div className="flex justify-between items-center mb-5 text-[14px]">
            <label className="flex items-center gap-2 text-[#555]">
              <input type="checkbox" className="accent-primary" /> Remember me
            </label>
            <Link href="/reset-password" className="text-primary no-underline font-medium">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn w-full py-4 bg-primary text-white border-none rounded-[10px] cursor-pointer text-[16px] font-semibold hover:bg-primary-hover transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-5 text-center text-[14px] text-[#555]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary no-underline font-semibold">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
