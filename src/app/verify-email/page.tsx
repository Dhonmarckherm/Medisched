"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { HospitalIcon, CheckCircleIcon, XCircleIcon } from "@/components/Icons";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/verify-email?token=${token}`);
        const data = await res.json();
        
        if (res.ok) {
          setStatus("success");
          setMessage(data.already_verified ? "Account was already verified!" : "Your account has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-white p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <HospitalIcon className="text-white" size={22} />
          </div>
          <span className="text-[18px] font-bold text-[#1a1a2e]">
            MEDISCHED <span className="text-primary">CERT</span>
          </span>
        </div>

        {status === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-5" />
            <h1 className="text-[22px] font-bold text-[#1a1a2e] mb-2">Verifying your account...</h1>
            <p className="text-gray-400 text-[14px]">Please wait while we verify your email</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircleIcon className="text-green-500" size={36} />
            </div>
            <h1 className="text-[22px] font-bold text-[#1a1a2e] mb-2">Account Verified!</h1>
            <p className="text-gray-500 text-[14px] mb-6">{message}</p>
            <Link href="/login"
              className="inline-block w-full py-3 bg-primary text-white rounded-lg text-[14px] font-medium no-underline hover:bg-primary-hover transition-colors">
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircleIcon className="text-red-500" size={36} />
            </div>
            <h1 className="text-[22px] font-bold text-[#1a1a2e] mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-[14px] mb-6">{message}</p>
            <Link href="/"
              className="inline-block w-full py-3 bg-primary text-white rounded-lg text-[14px] font-medium no-underline hover:bg-primary-hover transition-colors">
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
