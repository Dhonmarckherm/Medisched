"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

export default function PendingListPage() {
  const [user, setUser] = useState<any>(null);
  const [pendingAppts, setPendingAppts] = useState<any[]>([]);
  const [pendingCerts, setPendingCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUser } = await supabase
      .from("users").select("*").eq("auth_id", authUser.id).single();
    setUser(dbUser);

    const isAdminOrNurse = dbUser?.role === "admin" || dbUser?.role === "nurse";

    let apptQ = supabase.from("appointments").select("*")
      .eq("status", "Pending").order("created_at", { ascending: false });
    let certQ = supabase.from("certificates").select("*")
      .eq("status", "Pending").order("created_at", { ascending: false });

    if (!isAdminOrNurse) {
      apptQ = apptQ.eq("user_id", dbUser.id);
      certQ = certQ.eq("user_id", dbUser.id);
    }

    const [{ data: appts }, { data: certs }] = await Promise.all([apptQ, certQ]);
    setPendingAppts(appts || []);
    setPendingCerts(certs || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, type: "appointment" | "certificate", action: "Approved" | "Rejected") => {
    const table = type === "appointment" ? "appointments" : "certificates";
    await supabase.from(table).update({ status: action }).eq("id", id);
    if (type === "appointment") {
      setPendingAppts((prev) => prev.filter((a) => a.id !== id));
    } else {
      setPendingCerts((prev) => prev.filter((c) => c.id !== id));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f8fb" }}>Loading...</div>;

  const isAdminOrNurse = user?.role === "admin" || user?.role === "nurse";

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <h1 className="text-[30px] font-bold text-[#222] mb-8">Pending Items</h1>

        {/* Pending Appointments */}
        <div className="bg-white p-[35px] rounded-[18px] shadow-card mb-8">
          <h2 className="text-[26px] text-primary font-bold mb-5">
            Pending Appointments ({pendingAppts.length})
          </h2>
          {pendingAppts.length === 0 ? (
            <p className="text-[#555] text-center py-8">No pending appointments</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Name</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Date</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Purpose</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                    {isAdminOrNurse && <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {pendingAppts.map((appt, i) => (
                    <tr key={appt.id} className={i % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{appt.firstname} {appt.lastname}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] max-w-xs truncate">{appt.purpose}</td>
                      <td className="border border-[#ddd] py-3.5 px-4"><StatusBadge status={appt.status} /></td>
                      {isAdminOrNurse && (
                        <td className="border border-[#ddd] py-3.5 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleAction(appt.id, "appointment", "Approved")}
                              className="px-3 py-1.5 bg-primary text-white rounded-full text-[13px] font-semibold border-none cursor-pointer hover:bg-primary-hover hover:-translate-y-0.5 transition">Approve</button>
                            <button onClick={() => handleAction(appt.id, "appointment", "Rejected")}
                              className="px-3 py-1.5 bg-[#dc3545] text-white rounded-full text-[13px] font-semibold border-none cursor-pointer hover:bg-[#c82333] hover:-translate-y-0.5 transition">Reject</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Certificates */}
        <div className="bg-white p-[35px] rounded-[18px] shadow-card">
          <h2 className="text-[26px] text-primary font-bold mb-5">
            Pending Certificates ({pendingCerts.length})
          </h2>
          {pendingCerts.length === 0 ? (
            <p className="text-[#555] text-center py-8">No pending certificates</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Name</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Date Needed</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Purpose</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                    {isAdminOrNurse && <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {pendingCerts.map((cert, i) => (
                    <tr key={cert.id} className={i % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{cert.firstname} {cert.lastname}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{new Date(cert.date_needed).toLocaleDateString()}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] max-w-xs truncate">{cert.purpose}</td>
                      <td className="border border-[#ddd] py-3.5 px-4"><StatusBadge status={cert.status} /></td>
                      {isAdminOrNurse && (
                        <td className="border border-[#ddd] py-3.5 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleAction(cert.id, "certificate", "Approved")}
                              className="px-3 py-1.5 bg-primary text-white rounded-full text-[13px] font-semibold border-none cursor-pointer hover:bg-primary-hover hover:-translate-y-0.5 transition">Approve</button>
                            <button onClick={() => handleAction(cert.id, "certificate", "Rejected")}
                              className="px-3 py-1.5 bg-[#dc3545] text-white rounded-full text-[13px] font-semibold border-none cursor-pointer hover:bg-[#c82333] hover:-translate-y-0.5 transition">Reject</button>
                          </div>
                        </td>
                      )}
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
