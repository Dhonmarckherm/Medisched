import { SkeletonStatGrid, SkeletonTable } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Banner skeleton */}
        <div className="bg-gray-200 rounded-2xl h-[180px] mb-8 animate-pulse"></div>

        {/* Stats skeleton */}
        <SkeletonStatGrid count={4} />

        {/* Management cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
              <SkeletonTable rows={3} cols={2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
