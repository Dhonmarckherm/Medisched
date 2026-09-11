import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { CalendarIcon, CertificateIcon, UsersIcon, ClockIcon, ArrowRightIcon, ChartIcon } from "@/components/Icons";
import SignupQRWidget from "@/components/SignupQRWidget";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dbUserData } = await supabase.from("users").select("*").eq("auth_id", user.id).limit(1);
  const dbUser = dbUserData?.[0] || null;
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
  const pendingTotal = (pendingAppointments ?? 0) + (pendingCertificates ?? 0);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar user={dbUser} />
      <main className="pt-[100px] pb-12 w-[92%] max-w-[1240px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[13px] text-gray-400 font-medium mb-1">Admin Overview</p>
              <h1 className="text-[26px] font-bold text-[#111] tracking-tight m-0">
                Good day, {dbUser.first_name}
              </h1>
            </div>
            <div className="flex gap-2">
              <Link href="/pending"
                className="inline-flex items-center gap-1.5 bg-[#111] text-white px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-[#222] transition">
                View Pending <ArrowRightIcon size={14} />
              </Link>
              {isAdmin && (
                <Link href="/admin/users"
                  className="inline-flex items-center gap-1.5 bg-white text-[#333] px-4 py-2 rounded-lg no-underline text-[13px] font-medium hover:bg-gray-50 transition border border-gray-200">
                  <UsersIcon size={14} /> Users
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard title="Students" value={totalStudents ?? 0} icon={<UsersIcon size={18} />} color="blue" />
          <StatCard title="Appointments" value={totalAppointments ?? 0} icon={<CalendarIcon size={18} />} color="green" />
          <StatCard title="Certificates" value={totalCertificates ?? 0} icon={<CertificateIcon size={18} />} color="purple" />
          <StatCard title="Pending" value={pendingTotal} icon={<ClockIcon size={18} />} color="amber" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Link href="/admin/appointments" className="group flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 no-underline hover:border-gray-200 transition-all duration-150">
            <div className="w-9 h-9 rounded-[10px] bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CalendarIcon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[#111] text-[14px] m-0">Appointments</p>
              <p className="text-gray-400 text-[12px] m-0 mt-0.5">Manage all</p>
            </div>
          </Link>
          <Link href="/admin/certificates" className="group flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 no-underline hover:border-gray-200 transition-all duration-150">
            <div className="w-9 h-9 rounded-[10px] bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
              <CertificateIcon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[#111] text-[14px] m-0">Certificates</p>
              <p className="text-gray-400 text-[12px] m-0 mt-0.5">Manage all</p>
            </div>
          </Link>
          <Link href="/calendar" className="group flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 no-underline hover:border-gray-200 transition-all duration-150">
            <div className="w-9 h-9 rounded-[10px] bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <CalendarIcon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[#111] text-[14px] m-0">Calendar</p>
              <p className="text-gray-400 text-[12px] m-0 mt-0.5">Schedule view</p>
            </div>
          </Link>
          <Link href="/admin/analytics" className="group flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 no-underline hover:border-gray-200 transition-all duration-150">
            <div className="w-9 h-9 rounded-[10px] bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
              <ChartIcon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[#111] text-[14px] m-0">Analytics</p>
              <p className="text-gray-400 text-[12px] m-0 mt-0.5">Insights</p>
            </div>
          </Link>
        </div>

        {/* Pending Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Pending Appointments */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-[#111] m-0">Pending Appointments</h2>
                {(pendingAppts?.length ?? 0) > 0 && (
                  <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-1.5 py-0.5 rounded-md">{pendingAppts?.length}</span>
                )}
              </div>
              <Link href="/admin/appointments" className="text-[12px] text-gray-400 no-underline font-medium hover:text-[#111] transition flex items-center gap-0.5">
                View all <ArrowRightIcon size={12} />
              </Link>
            </div>
            {(!pendingAppts || pendingAppts.length === 0) ? (
              <div className="px-5 pb-8 pt-2">
                <div className="bg-gray-50/80 rounded-lg py-8 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <CalendarIcon size={18} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-[13px] m-0">All clear</p>
                  <p className="text-gray-300 text-[12px] m-0 mt-0.5">No pending appointments</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                      <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAppts.map((appt: any) => (
                      <tr key={appt.id} className="border-b border-gray-50/80 last:border-0 hover:bg-gray-50/40 transition">
                        <td className="py-3 px-5">
                          <p className="text-[13px] text-[#111] font-medium m-0">{appt.firstname} {appt.lastname}</p>
                          <p className="text-[12px] text-gray-400 m-0 mt-0.5 truncate max-w-[160px]">{appt.purpose}</p>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-gray-500 hidden sm:table-cell">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                        <td className="py-3 px-5"><StatusBadge status={appt.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Certificates */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-[#111] m-0">Pending Certificates</h2>
                {(pendingCerts?.length ?? 0) > 0 && (
                  <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-1.5 py-0.5 rounded-md">{pendingCerts?.length}</span>
                )}
              </div>
              <Link href="/admin/certificates" className="text-[12px] text-gray-400 no-underline font-medium hover:text-[#111] transition flex items-center gap-0.5">
                View all <ArrowRightIcon size={12} />
              </Link>
            </div>
            {(!pendingCerts || pendingCerts.length === 0) ? (
              <div className="px-5 pb-8 pt-2">
                <div className="bg-gray-50/80 rounded-lg py-8 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <CertificateIcon size={18} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-[13px] m-0">All clear</p>
                  <p className="text-gray-300 text-[12px] m-0 mt-0.5">No pending certificates</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date Needed</th>
                      <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCerts.map((cert: any) => (
                      <tr key={cert.id} className="border-b border-gray-50/80 last:border-0 hover:bg-gray-50/40 transition">
                        <td className="py-3 px-5">
                          <p className="text-[13px] text-[#111] font-medium m-0">{cert.firstname} {cert.lastname}</p>
                          <p className="text-[12px] text-gray-400 m-0 mt-0.5 truncate max-w-[160px]">{cert.purpose}</p>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-gray-500 hidden sm:table-cell">{new Date(cert.date_needed).toLocaleDateString()}</td>
                        <td className="py-3 px-5"><StatusBadge status={cert.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <SignupQRWidget />
          </div>
        </div>
      </main>
    </div>
  );
}
