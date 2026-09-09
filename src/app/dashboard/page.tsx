import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, getRecentActivity } from "@/lib/queries";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { CalendarIcon, CertificateIcon, ClockIcon } from "@/components/Icons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", user.id).single();
  if (!dbUser) redirect("/login");

  const [stats, recentActivity, accommodation] = await Promise.all([
    getDashboardStats(dbUser.id, dbUser.role),
    getRecentActivity(dbUser.id, dbUser.role),
    supabase.from("accommodations").select("*").eq("status", "active").order("id", { ascending: false }).limit(1).single(),
  ]);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar user={dbUser} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-[#1a1a2e]">
            Welcome, {dbUser.first_name} {dbUser.last_name}
          </h1>
          <p className="text-gray-400 mt-1 text-[14px]">
            Role: <span className="font-medium capitalize text-primary">{dbUser.role}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Appointments" value={stats.totalAppointments} icon={<CalendarIcon size={20} />} />
          <StatCard title="Total Certificates" value={stats.totalCertificates} icon={<CertificateIcon size={20} />} />
          <StatCard title="Pending Appointments" value={stats.pendingAppointments} icon={<ClockIcon size={20} />} />
          <StatCard title="Pending Certificates" value={stats.pendingCertificates} icon={<ClockIcon size={20} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h2 className="text-[18px] font-semibold text-[#1a1a2e] mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-[14px]">No recent activity</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Type</th>
                    <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Date</th>
                    <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item: any, index: number) => (
                    <tr key={index} className="border-t border-gray-50">
                      <td className="py-3 text-[14px] text-gray-600 capitalize">{item.type}</td>
                      <td className="py-3 text-[14px] text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="py-3"><StatusBadge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Actions & Schedule */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h2 className="text-[18px] font-semibold text-[#1a1a2e] mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/appointments/new"
                  className="flex items-center gap-3 w-full py-3 px-4 bg-primary/5 text-primary rounded-lg no-underline font-medium text-[14px] hover:bg-primary/10 transition">
                  <CalendarIcon size={18} /> Request Appointment
                </Link>
                <Link href="/certificates/new"
                  className="flex items-center gap-3 w-full py-3 px-4 bg-primary/5 text-primary rounded-lg no-underline font-medium text-[14px] hover:bg-primary/10 transition">
                  <CertificateIcon size={18} /> Request Certificate
                </Link>
              </div>
            </div>

            {accommodation.data && (
              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <h2 className="text-[18px] font-semibold text-[#1a1a2e] mb-4">Clinic Schedule</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-gray-400">Available From:</span>
                    <span className="font-medium text-gray-600">{new Date(accommodation.data.available_from).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-gray-400">Available To:</span>
                    <span className="font-medium text-gray-600">{new Date(accommodation.data.available_to).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px]">
                    <span className="text-gray-400">Status:</span>
                    <StatusBadge status={accommodation.data.status} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
