import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, getRecentActivity } from "@/lib/queries";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { CalendarIcon, CertificateIcon, ClockIcon, ArrowRightIcon } from "@/components/Icons";

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

  const isAdminOrNurse = dbUser.role === "admin" || dbUser.role === "nurse";

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar user={dbUser} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-emerald-600 rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-1/2 w-[120px] h-[120px] bg-white/5 rounded-full translate-y-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-[24px] sm:text-[28px] font-bold mb-1">
              Welcome back, {dbUser.first_name}!
            </h1>
            <p className="text-white/80 text-[14px] mb-4">
              {isAdminOrNurse
                ? "Here's an overview of the clinic system"
                : "Manage your appointments and certificate requests"}
            </p>
            <div className="flex flex-wrap gap-3">
              {!isAdminOrNurse && (
                <>
                  <Link href="/appointments/new"
                    className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-white/90 transition">
                    <CalendarIcon size={16} /> New Appointment
                  </Link>
                  <Link href="/certificates/new"
                    className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-white/25 transition border border-white/20">
                    <CertificateIcon size={16} /> New Certificate
                  </Link>
                </>
              )}
              {isAdminOrNurse && (
                <Link href="/pending"
                  className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-white/90 transition">
                  View Pending <ArrowRightIcon size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Appointments" value={stats.totalAppointments} icon={<CalendarIcon size={20} />} color="blue" />
          <StatCard title="Total Certificates" value={stats.totalCertificates} icon={<CertificateIcon size={20} />} color="purple" />
          <StatCard title="Pending Appointments" value={stats.pendingAppointments} icon={<ClockIcon size={20} />} color="amber" />
          <StatCard title="Pending Certificates" value={stats.pendingCertificates} icon={<ClockIcon size={20} />} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 pb-4">
              <h2 className="text-[16px] font-semibold text-[#1a1a2e]">Recent Activity</h2>
              {!isAdminOrNurse && (
                <Link href="/appointments" className="text-[13px] text-primary no-underline font-medium hover:underline flex items-center gap-1">
                  View All <ArrowRightIcon size={14} />
                </Link>
              )}
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-6 pb-6">
                <p className="text-gray-400 text-center py-8 text-[14px]">No recent activity</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-6 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                      <th className="text-left py-3 px-6 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.slice(0, 5).map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              item.type === "appointment" ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                            }`}>
                              {item.type === "appointment" ? <CalendarIcon size={16} /> : <CertificateIcon size={16} />}
                            </div>
                            <span className="text-[14px] text-gray-700 capitalize font-medium">{item.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[14px] text-gray-500 hidden sm:table-cell">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-3 px-6"><StatusBadge status={item.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clinic Schedule */}
            {accommodation.data && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-[16px] font-semibold text-[#1a1a2e] mb-4">Clinic Schedule</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                      <CalendarIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[12px] text-gray-400 m-0">Available From</p>
                      <p className="text-[14px] font-medium text-gray-700 m-0">{new Date(accommodation.data.available_from).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                      <CalendarIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[12px] text-gray-400 m-0">Available To</p>
                      <p className="text-[14px] font-medium text-gray-700 m-0">{new Date(accommodation.data.available_to).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[13px] text-gray-400">Status</span>
                    <StatusBadge status={accommodation.data.status} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats for admin/nurse */}
            {isAdminOrNurse && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-[16px] font-semibold text-[#1a1a2e] mb-4">Quick Links</h2>
                <div className="space-y-2">
                  <Link href="/admin/appointments"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 no-underline text-gray-600 transition group">
                    <span className="flex items-center gap-2 text-[14px]">
                      <CalendarIcon size={16} className="text-blue-500" /> Appointments
                    </span>
                    <ArrowRightIcon size={14} className="text-gray-300 group-hover:text-primary transition" />
                  </Link>
                  <Link href="/admin/certificates"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 no-underline text-gray-600 transition group">
                    <span className="flex items-center gap-2 text-[14px]">
                      <CertificateIcon size={16} className="text-purple-500" /> Certificates
                    </span>
                    <ArrowRightIcon size={14} className="text-gray-300 group-hover:text-primary transition" />
                  </Link>
                  <Link href="/admin/users"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 no-underline text-gray-600 transition group">
                    <span className="flex items-center gap-2 text-[14px]">
                      <CalendarIcon size={16} className="text-emerald-500" /> Users
                    </span>
                    <ArrowRightIcon size={14} className="text-gray-300 group-hover:text-primary transition" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
