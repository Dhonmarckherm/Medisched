import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
  color?: "green" | "blue" | "amber" | "purple";
}

const colorMap = {
  green: { bg: "bg-emerald-50", text: "text-emerald-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
};

export default function StatCard({ title, value, icon, color = "green" }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}>
          {icon}
        </div>
        <span className="text-[13px] text-gray-500 font-medium">{title}</span>
      </div>
      <h2 className="text-[28px] font-bold text-[#1a1a2e] leading-none">{value}</h2>
    </div>
  );
}
