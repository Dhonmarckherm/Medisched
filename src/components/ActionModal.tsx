"use client";

import { useState } from "react";
import { CheckCircleIcon, XCircleIcon } from "./Icons";

interface ActionModalProps {
  open: boolean;
  action: "Approved" | "Rejected";
  itemName: string;
  onConfirm: (remarks: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ActionModal({ open, action, itemName, onConfirm, onCancel, loading }: ActionModalProps) {
  const [remarks, setRemarks] = useState("");
  const isApprove = action === "Approved";

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(remarks);
    setRemarks("");
  };

  const handleCancel = () => {
    setRemarks("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-white rounded-2xl p-6 w-[90%] max-w-[420px] shadow-xl animate-scale-in">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isApprove ? "bg-emerald-50" : "bg-red-50"}`}>
          {isApprove ? <CheckCircleIcon className="text-emerald-500" size={24} /> : <XCircleIcon className="text-red-500" size={24} />}
        </div>

        {/* Title */}
        <h3 className="text-[16px] font-semibold text-[#1a1a2e] mb-1 text-center">
          {isApprove ? "Approve" : "Reject"} Request?
        </h3>
        <p className="text-[13px] text-gray-400 mb-4 text-center">
          {itemName}
        </p>

        {/* Remarks textarea */}
        <div className="mb-4">
          <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">
            Add a note (optional)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder={isApprove ? 'e.g., "Please bring your valid ID"' : 'e.g., "Incomplete documents"'}
            className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary transition resize-none"
            autoFocus
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button onClick={handleCancel} disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 bg-white cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isApprove ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} />
            ) : isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
