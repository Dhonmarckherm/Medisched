"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DownloadIcon, QrCodeIcon } from "@/components/Icons";

export default function SignupQRWidget() {
  const [copied, setCopied] = useState(false);
  const [signupUrl, setSignupUrl] = useState("");

  useEffect(() => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    setSignupUrl(`${siteUrl}/signup`);
  }, []);

  const handleDownload = () => {
    const svg = document.querySelector("#signup-qr svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "ISPSC-Signup-QR.png";
      link.href = pngUrl;
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <QrCodeIcon size={16} />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#111] m-0">Registration QR Code</h2>
          <p className="text-[12px] text-gray-400 m-0">Students can scan to sign up</p>
        </div>
      </div>

      <div className="px-5 pb-5 flex flex-col items-center">
        {signupUrl ? (
          <>
            <div id="signup-qr" className="bg-white p-4 rounded-xl border border-gray-100 mb-3">
              <QRCodeSVG
                value={signupUrl}
                size={160}
                bgColor="#ffffff"
                fgColor="#1a1a2e"
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="flex items-center gap-2 mb-3 w-full">
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
              className="w-full flex items-center justify-center gap-2 bg-primary text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-primary-hover transition"
            >
              <DownloadIcon size={14} /> Download QR Image
            </button>
          </>
        ) : (
          <div className="py-8 text-gray-400 text-[13px]">Loading QR code...</div>
        )}
      </div>
    </div>
  );
}
