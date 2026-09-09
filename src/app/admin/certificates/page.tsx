"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

export default function ManageCertificatesPage() {
  const [user, setUser] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUser } = await supabase
      .from("users").select("*").eq("auth_id", authUser.id).single();
    setUser(dbUser);

    const { data } = await supabase
      .from("certificates")
      .select("*, users(email)")
      .order("created_at", { ascending: false });
    setCertificates(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: "Approved" | "Rejected") => {
    await supabase.from("certificates").update({ status: action }).eq("id", id);
    setCertificates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: action } : c))
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f8fb" }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <h1 className="text-[30px] font-bold text-[#222] mb-8">Manage Certificates</h1>
        <div className="bg-white p-[35px] rounded-[18px] shadow-card">
          {certificates.length === 0 ? (
            <p className="text-[#555] text-center py-8">No certificates found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Name</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Student ID</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Purpose</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Date Needed</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert, i) => (
                    <tr key={cert.id} className={i % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{cert.firstname} {cert.lastname}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{cert.student_id}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px] max-w-xs truncate">{cert.purpose}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{new Date(cert.date_needed).toLocaleDateString()}</td>
                      <td className="border border-[#ddd] py-3.5 px-4"><StatusBadge status={cert.status} /></td>
                      <td className="border border-[#ddd] py-3.5 px-4">
                        {cert.status === "Pending" && (
                          <div className="flex gap-2">
                            <button onClick={() => handleAction(cert.id, "Approved")}
                              className="px-3 py-1.5 bg-primary text-white rounded-full text-[13px] font-semibold border-none cursor-pointer hover:bg-primary-hover hover:-translate-y-0.5 transition">Approve</button>
                            <button onClick={() => handleAction(cert.id, "Rejected")}
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
