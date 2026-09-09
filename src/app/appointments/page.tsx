import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

export default async function AppointmentsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", user.id).single();
  if (!dbUser) redirect("/login");

  const isAdminOrNurse = dbUser.role === "admin" || dbUser.role === "nurse";

  let query = supabase.from("appointments").select("*, users(email)").order("created_at", { ascending: false });
  if (!isAdminOrNurse) query = query.eq("user_id", dbUser.id);

  const { data: appointments } = await query;

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={dbUser} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[30px] font-bold text-[#222]">Appointments</h1>
          {!isAdminOrNurse && (
            <Link href="/appointments/new" className="bg-primary text-white rounded-full px-8 py-3 font-semibold no-underline hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg transition">
              + New Request
            </Link>
          )}
        </div>

        <div className="bg-white p-[35px] rounded-[18px] shadow-card overflow-hidden">
          {(!appointments || appointments.length === 0) ? (
            <div className="p-8 text-center text-[#555]">No appointments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Name</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Student ID</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Course</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Date</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Purpose</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt: any, i: number) => (
                    <tr key={appt.id} className={i % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{appt.firstname} {appt.lastname}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{appt.student_id}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{appt.course || "N/A"}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] max-w-xs truncate">{appt.purpose}</td>
                      <td className="border border-[#ddd] py-3.5 px-4"><StatusBadge status={appt.status} /></td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{new Date(appt.created_at).toLocaleDateString()}</td>
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
