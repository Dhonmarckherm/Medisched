import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

export default async function AdminDashboardPage() {
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

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "nurse"))
    redirect("/dashboard");

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
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={dbUser} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <div className="mb-10 fade-up">
          <h1 className="text-[30px] font-bold text-[#222]">Admin Dashboard</h1>
          <p className="text-[#555] mt-1 text-[16px]">
            Welcome, {dbUser.first_name} {dbUser.last_name} (<span className="capitalize text-primary font-semibold">{dbUser.role}</span>)
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[25px] mb-10">
          <StatCard title="Total Students" value={totalStudents ?? 0} icon="👥" />
          <StatCard title="Total Appointments" value={totalAppointments ?? 0} icon="📅" />
          <StatCard title="Total Certificates" value={totalCertificates ?? 0} icon="📜" />
          <StatCard title="Pending Items" value={(pendingAppointments ?? 0) + (pendingCertificates ?? 0)} icon="⏳" />
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[25px] mb-10">
          <Link href="/admin/appointments" className="dashboard-card bg-white p-[30px] rounded-[15px] text-center border border-[#e0e0e0] shadow-card no-underline hover:-translate-y-2 hover:border-primary hover:shadow-hover">
            <div className="w-[80px] h-[80px] bg-primary text-white rounded-full flex justify-center items-center mx-auto mb-5 text-[35px]">📅</div>
            <p className="font-semibold text-[#222] text-[16px]">Manage Appointments</p>
          </Link>
          <Link href="/admin/certificates" className="dashboard-card bg-white p-[30px] rounded-[15px] text-center border border-[#e0e0e0] shadow-card no-underline hover:-translate-y-2 hover:border-primary hover:shadow-hover">
            <div className="w-[80px] h-[80px] bg-primary text-white rounded-full flex justify-center items-center mx-auto mb-5 text-[35px]">📜</div>
            <p className="font-semibold text-[#222] text-[16px]">Manage Certificates</p>
          </Link>
          {isAdmin && (
            <Link href="/admin/users" className="dashboard-card bg-white p-[30px] rounded-[15px] text-center border border-[#e0e0e0] shadow-card no-underline hover:-translate-y-2 hover:border-primary hover:shadow-hover">
              <div className="w-[80px] h-[80px] bg-primary text-white rounded-full flex justify-center items-center mx-auto mb-5 text-[35px]">👤</div>
              <p className="font-semibold text-[#222] text-[16px]">Manage Users</p>
            </Link>
          )}
        </div>

        {/* Pending Appointments Table */}
        <div className="bg-white p-[35px] rounded-[18px] shadow-card mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[26px] text-primary font-bold">Pending Appointments</h2>
            <Link href="/admin/appointments" className="text-[14px] text-primary no-underline font-medium hover:underline">View All →</Link>
          </div>
          {(!pendingAppts || pendingAppts.length === 0) ? (
            <p className="text-[#555] text-center py-8">No pending appointments</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse mt-5">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Name</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Date</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Purpose</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAppts.map((appt: any, i: number) => (
                    <tr key={appt.id} className={i % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{appt.firstname} {appt.lastname}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] max-w-xs truncate">{appt.purpose}</td>
                      <td className="border border-[#ddd] py-3.5 px-4"><StatusBadge status={appt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Certificates Table */}
        <div className="bg-white p-[35px] rounded-[18px] shadow-card">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[26px] text-primary font-bold">Pending Certificates</h2>
            <Link href="/admin/certificates" className="text-[14px] text-primary no-underline font-medium hover:underline">View All →</Link>
          </div>
          {(!pendingCerts || pendingCerts.length === 0) ? (
            <p className="text-[#555] text-center py-8">No pending certificates</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse mt-5">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Name</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Date Needed</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Purpose</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCerts.map((cert: any, i: number) => (
                    <tr key={cert.id} className={i % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{cert.firstname} {cert.lastname}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{new Date(cert.date_needed).toLocaleDateString()}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] max-w-xs truncate">{cert.purpose}</td>
                      <td className="border border-[#ddd] py-3.5 px-4"><StatusBadge status={cert.status} /></td>
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
