export default function CertificatesLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      {/* Navbar placeholder */}
      <div className="fixed top-0 left-0 right-0 h-[64px] bg-white border-b border-gray-100 z-50 flex items-center px-6">
        <div className="w-[120px] h-[10px] bg-gray-100 rounded-full" />
      </div>

      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Title + button skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="w-[160px] h-[28px] bg-gray-100 rounded-lg" />
          <div className="w-[110px] h-[30px] bg-gray-100 rounded-lg" />
        </div>

        {/* Search bar skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 h-[42px] bg-gray-100 rounded-lg" />
          <div className="w-[140px] h-[42px] bg-gray-100 rounded-lg" />
        </div>

        {/* Results count skeleton */}
        <div className="w-[200px] h-[14px] bg-gray-100 rounded-full mb-3" />

        {/* Table skeleton */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Header row */}
          <div className="border-b border-gray-100 flex px-4 py-3 gap-4">
            {[100, 80, 120, 80, 70, 70, 50].map((w, i) => (
              <div key={i} className="h-[14px] bg-gray-100 rounded-full" style={{ width: w, minWidth: w, flexShrink: 0 }} />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <div key={rowIdx} className="border-b border-gray-50 flex px-4 py-3 gap-4 items-center">
              {[140, 80, 160, 70, 60, 60, 40].map((w, i) => (
                <div key={i} className="h-[13px] bg-gray-50 rounded-full" style={{ width: w, minWidth: w, flexShrink: 0, animation: `pulse 1.5s ease-in-out infinite`, animationDelay: `${rowIdx * 0.1}s` }} />
              ))}
            </div>
          ))}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
