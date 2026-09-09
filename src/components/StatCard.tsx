import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <span className="text-[13px] text-gray-500 font-medium">{title}</span>
      </div>
      <h2 className="text-[28px] font-bold text-[#1a1a2e] leading-none">{value}</h2>
    </div>
  );
}
