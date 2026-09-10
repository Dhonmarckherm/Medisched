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
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar user={dbUser} />
      <main className="pt-[100px] pb-12 w-[92%] max-w-[1240px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[13px] text-gray-400 font-medium mb-1">
                {isAdminOrNurse ? "Admin Overview" : "Student Portal"}
              </p>
              <h1 className="text-[26px] font-bold text-[#111] tracking-tight m-0">
                {isAdminOrNurse ? `Good day, ${dbUser.first_name}` : `Welcome back, ${dbUser.first_name}`}
              </h1>
            </div>
            <div className="flex gap-2">
              {!isAdminOrNurse && (
                <>
                  <Link href="/appointments/new"
                    className="inline-flex items-center gap-1.5 bg-[#111] text-white px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-[#222] transition">
                    <CalendarIcon size={14} /> New Appointment
                  </Link>
                  <Link href="/certificates/new"
                    className="inline-flex items-center gap-1.5 bg-white text-[#333] px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-gray-50 transition border border-gray-200">
                    <CertificateIcon size={14} /> Request Certificate
                  </Link>
                </>
              )}
              {isAdminOrNurse && (
                <Link href="/pending"
                  className="inline-flex items-center gap-1.5 bg-[#111] text-white px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-[#222] transition">
                  View Pending <ArrowRightIcon size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {isAdminOrNurse ? (
            <>
              <StatCard title="Appointments" value={stats.totalAppointments} icon={<CalendarIcon size={18} />} color="blue" />
              <StatCard title="Certificates" value={stats.totalCertificates} icon={<CertificateIcon size={18} />} color="purple" />
              <StatCard title="Pending Appts" value={stats.pendingAppointments} icon={<ClockIcon size={18} />} color="amber" />
              <StatCard title="Pending Certs" value={stats.pendingCertificates} icon={<ClockIcon size={18} />} color="amber" />
            </>
          ) : (
            <>
              <StatCard title="My Appointments" value={stats.totalAppointments} icon={<CalendarIcon size={18} />} color="blue" />
              <StatCard title="My Certificates" value={stats.totalCertificates} icon={<CertificateIcon size={18} />} color="purple" />
              <StatCard title="Pending Appts" value={stats.pendingAppointments} icon={<ClockIcon size={18} />} color="amber" />
              <StatCard title="Pending Certs" value={stats.pendingCertificates} icon={<ClockIcon size={18} />} color="amber" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center px-5 pt-5 pb-3">
              <h2 className="text-[15px] font-semibold text-[#111] m-0">Recent Activity</h2>
              {!isAdminOrNurse && (
                <Link href="/appointments" className="text-[12px] text-gray-400 no-underline font-medium hover:text-[#111] transition flex items-center gap-0.5">
                  View all <ArrowRightIcon size={12} />
                </Link>
              )}
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-5 pb-8 pt-2">
                <div className="bg-gray-50/80 rounded-lg py-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <CalendarIcon size={18} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-[13px] m-0">No activity yet</p>
                  <p className="text-gray-300 text-[12px] m-0 mt-0.5">
                    {isAdminOrNurse ? "No recent system activity" : "Book an appointment to get started"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                      <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.slice(0, 6).map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-50/80 last:border-0 hover:bg-gray-50/40 transition">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
                              item.type === "appointment" ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                            }`}>
                              {item.type === "appointment" ? <CalendarIcon size={15} /> : <CertificateIcon size={15} />}
                            </div>
                            <span className="text-[13px] text-[#111] font-medium capitalize">{item.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-gray-500 hidden sm:table-cell">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-3 px-5"><StatusBadge status={item.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Clinic Schedule */}
            {accommodation.data && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-[15px] font-semibold text-[#111] mb-4 m-0">Clinic Hours</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-400">Available From</span>
                    <span className="text-[13px] font-medium text-[#111]">{new Date(accommodation.data.available_from).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-400">Available To</span>
                    <span className="text-[13px] font-medium text-[#111]">{new Date(accommodation.data.available_to).toLocaleDateString()}</span>
                  </div>
                  {accommodation.data.open_time && accommodation.data.close_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-gray-400">Hours</span>
                      <span className="text-[13px] font-medium text-[#111]">
                        {formatTime(accommodation.data.open_time)} — {formatTime(accommodation.data.close_time)}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[13px] text-gray-400">Status</span>
                    <StatusBadge status={accommodation.data.status} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links for admin/nurse */}
            {isAdminOrNurse && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-[15px] font-semibold text-[#111] mb-3 m-0">Quick Links</h2>
                <div className="space-y-1">
                  <Link href="/admin/appointments"
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 no-underline text-gray-600 transition group">
                    <span className="flex items-center gap-2.5 text-[13px]">
                      <CalendarIcon size={15} className="text-emerald-500" /> Appointments
                    </span>
                    <ArrowRightIcon size={13} className="text-gray-300 group-hover:text-gray-400 transition" />
                  </Link>
                  <Link href="/admin/certificates"
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 no-underline text-gray-600 transition group">
                    <span className="flex items-center gap-2.5 text-[13px]">
                      <CertificateIcon size={15} className="text-purple-500" /> Certificates
                    </span>
                    <ArrowRightIcon size={13} className="text-gray-300 group-hover:text-gray-400 transition" />
                  </Link>
                  <Link href="/admin/users"
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 no-underline text-gray-600 transition group">
                    <span className="flex items-center gap-2.5 text-[13px]">
                      <CalendarIcon size={15} className="text-blue-500" /> Users
                    </span>
                    <ArrowRightIcon size={13} className="text-gray-300 group-hover:text-gray-400 transition" />
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

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
