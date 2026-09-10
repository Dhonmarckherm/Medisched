export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      {/* Logo mark */}
      <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M9 14h.01" /><path d="M15 14h.01" />
        </svg>
      </div>

      {/* App name */}
      <div className="text-center mb-6">
        <h1 className="text-[17px] font-bold text-[#1a1a2e] tracking-tight m-0">
          MEDISCHED <span className="text-primary">CERT</span>
        </h1>
      </div>

      {/* Loading indicator — thin animated bar */}
      <div className="w-[120px] h-[2px] bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{
            animation: "loading-bar 1.2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
