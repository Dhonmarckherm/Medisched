export default function CalendarLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#f8faf9" }}>
      <div className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid skeleton */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="py-3 text-center">
                  <div className="h-3 w-8 bg-gray-100 rounded mx-auto animate-pulse" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-[80px] border-b border-r border-gray-50 p-1.5">
                  <div className="w-7 h-7 bg-gray-100 rounded-full animate-pulse mb-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Side panel skeleton */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="p-5">
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
