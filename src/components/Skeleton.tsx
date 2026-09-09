// Reusable skeleton loading components

export function SkeletonCard() {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="h-7 bg-gray-200 rounded w-16"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="text-left pb-3">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-gray-50">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="py-3">
                  <div className="h-4 bg-gray-200 rounded w-full max-w-[150px]"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
