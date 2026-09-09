interface StatCardProps {
  title: string;
  value: number;
  icon?: string;
}

export default function StatCard({ title, value, icon = "📊" }: StatCardProps) {
  return (
    <div className="stat-box bg-white p-[25px] text-center rounded-[15px] border border-[#e0e0e0] hover:-translate-y-2 hover:border-primary hover:shadow-hover">
      <div className="text-[35px] text-primary mb-2.5">{icon}</div>
      <h2 className="text-[28px] font-bold text-primary mb-2">{value}</h2>
      <p className="text-[15px] text-[#555]">{title}</p>
    </div>
  );
}
