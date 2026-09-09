import { SkeletonStatGrid, SkeletonTable } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      {/* Banner skeleton */}
      <div className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <div className="bg-gray-200 rounded-2xl h-[180px] mb-8 animate-pulse"></div>

        {/* Stats skeleton */}
        <SkeletonStatGrid count={4} />

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <SkeletonTable rows={5} cols={3} />
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
