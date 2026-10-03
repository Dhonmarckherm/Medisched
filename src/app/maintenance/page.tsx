"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, HospitalIcon } from "@/components/Icons";

// Shown when the clinic database is unreachable on an install that is already
// licensed. Deliberately contains NO payment/license language: a database
// outage must never be presented as an unlicensed product.
const RETRY_SECONDS = 15;

export default function MaintenancePage() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(RETRY_SECONDS);
  const [restored, setRestored] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const res = await fetch("/api/license", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok && data.activated) {
          setRestored(true);
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }
      } catch {
        // Still unreachable — keep counting down and retry.
      }
      setChecked(true);
    }

    probe();
    const poll = setInterval(probe, RETRY_SECONDS * 1000);
    const tick = setInterval(() => {
      setRemaining((s) => (s <= 1 ? RETRY_SECONDS : s - 1));
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [router]);

  if (restored) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#84B179]/10 via-white to-[#84B179]/5 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#111] mb-2">Connection Restored</h1>
          <p className="text-gray-500 text-sm">The clinic database is back online. Redirecting to login...</p>
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
            <HospitalIcon size={28} className="text-[#84B179]" />
          </div>
          <h1 className="text-2xl font-bold text-[#111] mb-1">MEDISCHED CERT</h1>
          <p className="text-gray-400 text-sm">Temporarily Unavailable</p>
        </div>

        {/* Notice Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-50">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <AlertCircleIcon size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#111] m-0">System maintenance</h2>
              <p className="text-[11px] text-gray-400 m-0 mt-0.5">
                The clinic database cannot be reached right now
              </p>
            </div>
          </div>

          <p className="text-[13px] text-gray-600 leading-relaxed m-0">
            This is a <strong>temporary connection problem</strong> with the database, not a
            license or payment issue. Your activation is intact and no action is required from you.
          </p>

          <div className="mt-4 bg-amber-50/60 border border-amber-100 rounded-lg px-3.5 py-3">
            <p className="text-[12px] text-amber-800 m-0 leading-relaxed">
              This page will reload automatically once the connection returns. If the problem
              lasts more than a few minutes, contact the system administrator and mention that
              the database appears to be <strong>paused or offline</strong>.
            </p>
          </div>

          {/* Retry status */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[12px] text-gray-500">
            <ClockIcon size={14} className="text-gray-400" />
            <span>
              {checked ? "Still unreachable — retrying" : "Checking connection"} in {remaining}s
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setRemaining(RETRY_SECONDS);
              window.location.reload();
            }}
            className="mt-4 w-full py-2.5 bg-[#84B179] hover:bg-[#73a068] text-white text-[13px] font-semibold rounded-lg transition cursor-pointer border-none"
          >
            Retry now
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-300 mt-6">
          MEDISCHED CERT &copy; {new Date().getFullYear()} &middot; ISPSC Candon Campus
        </p>
      </div>
    </div>
  );
}
