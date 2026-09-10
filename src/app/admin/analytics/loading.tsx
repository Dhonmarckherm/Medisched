export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#f8faf9" }}>
      <div className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-56 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse mb-3" />
              <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-6" />
              <div className="h-[200px] bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
