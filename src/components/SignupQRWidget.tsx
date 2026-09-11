"use client";

import { useState, useEffect } from "react";
import { DownloadIcon, QrCodeIcon } from "@/components/Icons";

export default function SignupQRWidget() {
  const [copied, setCopied] = useState(false);
  const [signupUrl, setSignupUrl] = useState("");

  useEffect(() => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    setSignupUrl(`${siteUrl}/signup`);
  }, []);

  const handleDownload = () => {
    if (!signupUrl) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(signupUrl)}&margin=10`;
    const link = document.createElement("a");
    link.download = "ISPSC-Signup-QR.png";
    link.href = qrUrl;
    link.target = "_blank";
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = signupUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(signupUrl)}&margin=10`
    : "";

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5">
        {/* QR Code Image */}
        <div className="flex-shrink-0">
          {qrImageUrl ? (
            <div className="bg-white p-3 rounded-xl border border-gray-100">
              <img
                src={qrImageUrl}
                alt="Signup QR Code"
                width={160}
                height={160}
                className="block"
              />
            </div>
          ) : (
            <div className="w-[160px] h-[160px] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-[12px]">Loading...</span>
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <QrCodeIcon size={16} />
            </div>
            <h2 className="text-[17px] font-semibold text-[#111] m-0">Registration QR Code</h2>
          </div>
          <p className="text-gray-400 text-[13px] mb-4">Students can scan this QR code or use the link below to sign up</p>

          {signupUrl && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-[12px] text-gray-500 truncate border border-gray-100">
                  {signupUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition flex-shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 bg-primary text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-primary-hover transition"
              >
                <DownloadIcon size={14} /> Download QR Image
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
