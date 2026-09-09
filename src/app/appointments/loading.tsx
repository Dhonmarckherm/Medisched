import { SkeletonTable } from "@/components/Skeleton";

export default function AppointmentsLoading() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-56 mb-3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
        </div>

        {/* Search + Filter skeleton */}
        <div className="flex gap-3 mb-6">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Table skeleton */}
        <SkeletonTable rows={8} cols={6} />
      </div>
    </div>
  );
}
