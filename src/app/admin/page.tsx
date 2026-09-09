import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { CalendarIcon, CertificateIcon, UsersIcon, ClockIcon } from "@/components/Icons";

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
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-[#1a1a2e]">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1 text-[14px]">
            Welcome, {dbUser.first_name} {dbUser.last_name} &middot; <span className="capitalize text-primary font-medium">{dbUser.role}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Students" value={totalStudents ?? 0} icon={<UsersIcon size={20} />} />
          <StatCard title="Total Appointments" value={totalAppointments ?? 0} icon={<CalendarIcon size={20} />} />
          <StatCard title="Total Certificates" value={totalCertificates ?? 0} icon={<CertificateIcon size={20} />} />
          <StatCard title="Pending Items" value={(pendingAppointments ?? 0) + (pendingCertificates ?? 0)} icon={<ClockIcon size={20} />} />
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/appointments" className="bg-white p-6 rounded-xl border border-gray-100 no-underline hover:border-primary/30 hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <CalendarIcon size={20} />
            </div>
            <p className="font-medium text-[#1a1a2e] text-[15px]">Manage Appointments</p>
            <p className="text-gray-400 text-[13px] mt-1">View and manage all appointments</p>
          </Link>
          <Link href="/admin/certificates" className="bg-white p-6 rounded-xl border border-gray-100 no-underline hover:border-primary/30 hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <CertificateIcon size={20} />
            </div>
            <p className="font-medium text-[#1a1a2e] text-[15px]">Manage Certificates</p>
            <p className="text-gray-400 text-[13px] mt-1">View and manage all certificates</p>
          </Link>
          {isAdmin && (
            <Link href="/admin/users" className="bg-white p-6 rounded-xl border border-gray-100 no-underline hover:border-primary/30 hover:shadow-sm transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <UsersIcon size={20} />
              </div>
              <p className="font-medium text-[#1a1a2e] text-[15px]">Manage Users</p>
              <p className="text-gray-400 text-[13px] mt-1">Manage roles and permissions</p>
            </Link>
          )}
        </div>

        {/* Pending Tables */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[18px] font-semibold text-[#1a1a2e]">Pending Appointments</h2>
            <Link href="/admin/appointments" className="text-[13px] text-primary no-underline font-medium hover:underline">View All</Link>
          </div>
          {(!pendingAppts || pendingAppts.length === 0) ? (
            <p className="text-gray-400 text-center py-8 text-[14px]">No pending appointments</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Name</th>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Date</th>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Purpose</th>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingAppts.map((appt: any) => (
                  <tr key={appt.id} className="border-t border-gray-50">
                    <td className="py-3 text-[14px] text-gray-600">{appt.firstname} {appt.lastname}</td>
                    <td className="py-3 text-[14px] text-gray-500">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                    <td className="py-3 text-[14px] text-gray-500 max-w-xs truncate">{appt.purpose}</td>
                    <td className="py-3"><StatusBadge status={appt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[18px] font-semibold text-[#1a1a2e]">Pending Certificates</h2>
            <Link href="/admin/certificates" className="text-[13px] text-primary no-underline font-medium hover:underline">View All</Link>
          </div>
          {(!pendingCerts || pendingCerts.length === 0) ? (
            <p className="text-gray-400 text-center py-8 text-[14px]">No pending certificates</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Name</th>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Date Needed</th>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Purpose</th>
                  <th className="text-left text-[12px] font-medium text-gray-400 uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingCerts.map((cert: any) => (
                  <tr key={cert.id} className="border-t border-gray-50">
                    <td className="py-3 text-[14px] text-gray-600">{cert.firstname} {cert.lastname}</td>
                    <td className="py-3 text-[14px] text-gray-500">{new Date(cert.date_needed).toLocaleDateString()}</td>
                    <td className="py-3 text-[14px] text-gray-500 max-w-xs truncate">{cert.purpose}</td>
                    <td className="py-3"><StatusBadge status={cert.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
