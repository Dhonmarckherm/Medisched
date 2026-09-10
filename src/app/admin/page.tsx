import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { CalendarIcon, CertificateIcon, UsersIcon, ClockIcon, ArrowRightIcon, ChartIcon } from "@/components/Icons";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", user.id).single();
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "nurse")) redirect("/dashboard");

  const [
    { count: totalStudents },
    { count: totalAppointments },
    { count: totalCertificates },
    { count: pendingAppointments },
    { count: pendingCertificates },
    { data: pendingAppts },
    { data: pendingCerts },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase.from("certificates").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "Pending"),
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("status", "Pending"),
    supabase.from("appointments").select("*").eq("status", "Pending").order("created_at", { ascending: false }).limit(5),
    supabase.from("certificates").select("*").eq("status", "Pending").order("created_at", { ascending: false }).limit(5),
  ]);

  const isAdmin = dbUser.role === "admin";

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
              Admin Dashboard
            </h1>
            <p className="text-white/80 text-[14px] mb-4">
              Welcome, {dbUser.first_name} {dbUser.last_name} &middot; <span className="capitalize font-medium">{dbUser.role}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/pending"
                className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-white/90 transition">
                View Pending <ArrowRightIcon size={16} />
              </Link>
              {isAdmin && (
                <Link href="/admin/users"
                  className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-white/25 transition border border-white/20">
                  <UsersIcon size={16} /> Manage Users
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Students" value={totalStudents ?? 0} icon={<UsersIcon size={20} />} color="blue" />
          <StatCard title="Total Appointments" value={totalAppointments ?? 0} icon={<CalendarIcon size={20} />} color="green" />
          <StatCard title="Total Certificates" value={totalCertificates ?? 0} icon={<CertificateIcon size={20} />} color="purple" />
          <StatCard title="Pending Items" value={(pendingAppointments ?? 0) + (pendingCertificates ?? 0)} icon={<ClockIcon size={20} />} color="amber" />
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/appointments" className="bg-white p-6 rounded-xl border border-gray-100 no-underline hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <CalendarIcon size={20} />
            </div>
            <p className="font-medium text-[#1a1a2e] text-[15px]">Appointments</p>
            <p className="text-gray-400 text-[13px] mt-1">Manage all appointments</p>
            <ArrowRightIcon size={16} className="text-gray-300 mt-3 group-hover:text-primary transition" />
          </Link>
          <Link href="/admin/certificates" className="bg-white p-6 rounded-xl border border-gray-100 no-underline hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <CertificateIcon size={20} />
            </div>
            <p className="font-medium text-[#1a1a2e] text-[15px]">Certificates</p>
            <p className="text-gray-400 text-[13px] mt-1">Manage all certificates</p>
            <ArrowRightIcon size={16} className="text-gray-300 mt-3 group-hover:text-primary transition" />
          </Link>
          <Link href="/calendar" className="bg-white p-6 rounded-xl border border-gray-100 no-underline hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <CalendarIcon size={20} />
            </div>
            <p className="font-medium text-[#1a1a2e] text-[15px]">Calendar</p>
            <p className="text-gray-400 text-[13px] mt-1">Visual appointment schedule</p>
            <ArrowRightIcon size={16} className="text-gray-300 mt-3 group-hover:text-primary transition" />
          </Link>
          <Link href="/admin/analytics" className="bg-white p-6 rounded-xl border border-gray-100 no-underline hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
              <ChartIcon size={20} />
            </div>
            <p className="font-medium text-[#1a1a2e] text-[15px]">Analytics</p>
            <p className="text-gray-400 text-[13px] mt-1">Usage insights & reports</p>
            <ArrowRightIcon size={16} className="text-gray-300 mt-3 group-hover:text-primary transition" />
          </Link>
        </div>

        {/* Pending Tables */}
        <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
          <div className="flex justify-between items-center p-6 pb-4">
            <h2 className="text-[16px] font-semibold text-[#1a1a2e]">Pending Appointments</h2>
            <Link href="/admin/appointments" className="text-[13px] text-primary no-underline font-medium hover:underline flex items-center gap-1">
              View All <ArrowRightIcon size={14} />
            </Link>
          </div>
          {(!pendingAppts || pendingAppts.length === 0) ? (
            <p className="text-gray-400 text-center py-8 text-[14px]">No pending appointments</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Purpose</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAppts.map((appt: any) => (
                    <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 text-[14px] text-gray-700">{appt.firstname} {appt.lastname}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 hidden sm:table-cell">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 max-w-[200px] truncate hidden md:table-cell">{appt.purpose}</td>
                      <td className="py-3 px-4"><StatusBadge status={appt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 pb-4">
            <h2 className="text-[16px] font-semibold text-[#1a1a2e]">Pending Certificates</h2>
            <Link href="/admin/certificates" className="text-[13px] text-primary no-underline font-medium hover:underline flex items-center gap-1">
              View All <ArrowRightIcon size={14} />
            </Link>
          </div>
          {(!pendingCerts || pendingCerts.length === 0) ? (
            <p className="text-gray-400 text-center py-8 text-[14px]">No pending certificates</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date Needed</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Purpose</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCerts.map((cert: any) => (
                    <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 text-[14px] text-gray-700">{cert.firstname} {cert.lastname}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 hidden sm:table-cell">{new Date(cert.date_needed).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 max-w-[200px] truncate hidden md:table-cell">{cert.purpose}</td>
                      <td className="py-3 px-4"><StatusBadge status={cert.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
