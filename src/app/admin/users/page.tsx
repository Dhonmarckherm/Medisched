"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

export default function ManageUsersPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUser } = await supabase
      .from("users").select("*").eq("auth_id", authUser.id).single();
    setUser(dbUser);

    if (dbUser?.role !== "admin") return;
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChangeRole = async (id: string, role: string) => {
    await supabase.from("users").update({ role }).eq("id", id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await supabase.from("users").update({ active_status: newStatus }).eq("id", id);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active_status: newStatus } : u))
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f8fb" }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <h1 className="text-[30px] font-bold text-[#222] mb-8">Manage Users</h1>
        <div className="bg-white p-[35px] rounded-[18px] shadow-card">
          {users.length === 0 ? (
            <p className="text-[#555] text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Name</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Email</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">ID Number</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Role</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Status</th>
                    <th className="bg-primary text-white font-semibold py-3.5 px-4 text-left text-[14px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className={i % 2 === 1 ? "bg-[#f9f9f9]" : ""}>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{u.first_name} {u.last_name}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{u.email}</td>
                      <td className="border border-[#ddd] py-3.5 px-4 text-[14px]">{u.id_number}</td>
                      <td className="border border-[#ddd] py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="text-[13px] border border-[#dcdcdc] rounded-[8px] py-1.5 px-2 outline-none focus:border-primary font-[Poppins]"
                        >
                          <option value="student">Student</option>
                          <option value="nurse">Nurse</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="border border-[#ddd] py-3.5 px-4">
                        <StatusBadge status={u.active_status} />
                      </td>
                      <td className="border border-[#ddd] py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.active_status)}
                          className={`px-3 py-1.5 rounded-full text-[13px] font-semibold text-white border-none cursor-pointer hover:-translate-y-0.5 transition ${
                            u.active_status === "active"
                              ? "bg-[#dc3545] hover:bg-[#c82333]"
                              : "bg-primary hover:bg-primary-hover"
                          }`}
                        >
                          {u.active_status === "active" ? "Deactivate" : "Activate"}
                        </button>
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
