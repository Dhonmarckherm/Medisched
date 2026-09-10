import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
  color?: "green" | "blue" | "amber" | "purple";
}

const colorMap = {
  green: { bg: "bg-emerald-50", text: "text-emerald-600", accent: "bg-emerald-500" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", accent: "bg-blue-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", accent: "bg-amber-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", accent: "bg-purple-500" },
};

export default function StatCard({ title, value, icon, color = "green" }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className="relative bg-white p-5 rounded-xl border border-gray-100/80 hover:border-gray-200 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-[10px] ${colors.bg} flex items-center justify-center ${colors.text} transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
        <span className="text-[28px] font-bold text-[#111] leading-none tabular-nums tracking-tight">{value}</span>
      </div>
      <p className="text-[13px] text-gray-500 font-medium leading-none">{title}</p>
    </div>
  );
}
