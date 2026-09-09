"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

export default function ManageAppointmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUser } = await supabase
      .from("users").select("*").eq("auth_id", authUser.id).single();
    setUser(dbUser);

    const { data } = await supabase
      .from("appointments")
      .select("*, users(email)")
      .order("created_at", { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: "Approved" | "Rejected") => {
    await supabase.from("appointments").update({ status: action }).eq("id", id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: action } : a))
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f8fb" }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <h1 className="text-[30px] font-bold text-[#222] mb-8">Manage Appointments</h1>
        <div className="bg-white p-[35px] rounded-[18px] shadow-card">
          {appointments.length === 0 ? (
            <p className="text-[#555] text-center py-8">No appointments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Name</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Student ID</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Date</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Purpose</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt, i) => (
                    <tr key={appt.id} className={i % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{appt.firstname} {appt.lastname}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{appt.student_id}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] max-w-xs truncate">{appt.purpose}</td>
                      <td className="border border-[#ddd] py-3.5 px-4"><StatusBadge status={appt.status} /></td>
                      <td className="border border-[#ddd] py-3.5 px-4">
                        {appt.status === "Pending" && (
                          <div className="flex gap-2">
                            <button onClick={() => handleAction(appt.id, "Approved")}
                              className="px-3 py-1.5 bg-primary text-white rounded-full text-[13px] font-semibold border-none cursor-pointer hover:bg-primary-hover hover:-translate-y-0.5 transition">Approve</button>
                            <button onClick={() => handleAction(appt.id, "Rejected")}
                              className="px-3 py-1.5 bg-[#dc3545] text-white rounded-full text-[13px] font-semibold border-none cursor-pointer hover:bg-[#c82333] hover:-translate-y-0.5 transition">Reject</button>
                          </div>
                        )}
                      </td>
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
