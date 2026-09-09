interface StatusBadgeProps {
  status: "Pending" | "Approved" | "Rejected" | "active" | "inactive" | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    Pending: "bg-[#fff3cd] text-[#664d03]",
    Approved: "bg-[#d1e7dd] text-[#0f5132]",
    Rejected: "bg-[#f8d7da] text-[#842029]",
    active: "bg-[#d1e7dd] text-[#0f5132]",
    inactive: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-semibold ${
        colors[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status === "Pending" && "⏳ "}
      {status === "Approved" && "✅ "}
      {status === "Rejected" && "❌ "}
      {status === "active" && "🟢 "}
      {status === "inactive" && "⚪ "}
      {status}
    </span>
  );
}
