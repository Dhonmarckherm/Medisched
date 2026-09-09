import { SkeletonForm } from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-40 mb-3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-56 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonForm />
          <SkeletonForm />
        </div>
      </div>
    </div>
  );
}
