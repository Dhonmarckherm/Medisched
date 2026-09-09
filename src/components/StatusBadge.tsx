interface StatusBadgeProps {
  status: "Pending" | "Approved" | "Rejected" | "active" | "inactive" | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Rejected: "bg-red-50 text-red-700 border border-red-200",
    active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    inactive: "bg-gray-50 text-gray-500 border border-gray-200",
  };

  const dotColors: Record<string, string> = {
    Pending: "bg-amber-500",
    Approved: "bg-emerald-500",
    Rejected: "bg-red-500",
    active: "bg-emerald-500",
    inactive: "bg-gray-400",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium ${styles[status] || "bg-gray-50 text-gray-500 border border-gray-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || "bg-gray-400"}`} />
      {status}
    </span>
  );
}
