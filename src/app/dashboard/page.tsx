import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, getRecentActivity } from "@/lib/queries";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");

  const [stats, recentActivity, accommodation] = await Promise.all([
    getDashboardStats(dbUser.id, dbUser.role),
    getRecentActivity(dbUser.id, dbUser.role),
    supabase
      .from("accommodations")
      .select("*")
      .eq("status", "active")
      .order("id", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={dbUser} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Welcome Header */}
        <div className="mb-10 fade-up">
          <h1 className="text-[30px] font-bold text-[#222]">
            Welcome, {dbUser.first_name} {dbUser.last_name}
          </h1>
          <p className="text-[#555] mt-1 text-[16px]">
            Role: <span className="font-semibold capitalize text-primary">{dbUser.role}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[25px] mb-10">
          <StatCard title="Total Appointments" value={stats.totalAppointments} icon="📅" />
          <StatCard title="Total Certificates" value={stats.totalCertificates} icon="📜" />
          <StatCard title="Pending Appointments" value={stats.pendingAppointments} icon="⏳" />
          <StatCard title="Pending Certificates" value={stats.pendingCertificates} icon="⏳" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px]">
          {/* Recent Activity Table */}
          <div className="bg-white p-[35px] rounded-[18px] shadow-card fade-up">
            <h2 className="text-[26px] text-primary font-bold text-center mb-5">
              Recent Activity
            </h2>
            {recentActivity.length === 0 ? (
              <p className="text-[#555] text-center py-8">No recent activity</p>
            ) : (
              <table className="w-full border-collapse mt-5">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Type</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Date</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item: any, index: number) => (
                    <tr key={index} className={index % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] text-[#333]">{item.type}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] text-[#333]">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="border border-[#ddd] py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Actions & Accommodation */}
          <div className="space-y-[25px]">
            {/* Quick Actions */}
            <div className="dashboard-card bg-white p-[30px] rounded-[15px] border border-[#e0e0e0] shadow-card hover:-translate-y-2 hover:border-primary hover:shadow-hover">
              <h2 className="text-[22px] font-semibold text-[#222] mb-5 text-center">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/appointments/new"
                  className="block w-full text-center py-3.5 bg-primary text-white rounded-[10px] no-underline font-semibold text-[16px] hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg transition"
                >
                  📅 Request Appointment
                </Link>
                <Link
                  href="/certificates/new"
                  className="block w-full text-center py-3.5 bg-primary text-white rounded-[10px] no-underline font-semibold text-[16px] hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg transition"
                >
                  📜 Request Certificate
                </Link>
              </div>
            </div>

            {/* Clinic Schedule */}
            {accommodation.data && (
              <div className="dashboard-card bg-white p-[30px] rounded-[15px] border border-[#e0e0e0] shadow-card hover:-translate-y-2 hover:border-primary hover:shadow-hover">
                <h2 className="text-[22px] font-semibold text-[#222] mb-5 text-center">Clinic Schedule</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#555]">Available From:</span>
                    <span className="font-semibold text-[#333]">
                      {new Date(accommodation.data.available_from).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#555]">Available To:</span>
                    <span className="font-semibold text-[#333]">
                      {new Date(accommodation.data.available_to).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="text-[#555]">Status:</span>
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
