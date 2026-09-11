"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/Toast";
import { UsersIcon, ShieldIcon, UserXIcon } from "@/components/Icons";
import { logActivity } from "@/lib/activityLog";

const ITEMS_PER_PAGE = 10;

export default function ManageUsersPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const supabase = createClient();
  const { addToast } = useToast();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUserData } = await supabase.from("users").select("*").eq("auth_id", authUser.id).limit(1);
    const dbUser = dbUserData?.[0] || null;
    setUser(dbUser);
    if (dbUser?.role !== "admin") return;
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChangeRole = async (id: string, role: string) => {
    const targetUser = users.find((u) => u.id === id);
    const { error } = await supabase.from("users").update({ role }).eq("id", id);
    if (error) { addToast("error", "Failed to update role"); return; }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    addToast("success", `Role updated to ${role}`);
    logActivity("role_changed", "user", id, `${targetUser?.first_name} ${targetUser?.last_name} → ${role}`);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const targetUser = users.find((u) => u.id === id);
    const { error } = await supabase.from("users").update({ active_status: newStatus }).eq("id", id);
    if (error) { addToast("error", "Failed to toggle status"); return; }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active_status: newStatus } : u)));
    addToast("success", `User ${newStatus === "active" ? "activated" : "deactivated"}`);
    logActivity(newStatus === "active" ? "user_activated" : "user_deactivated", "user", id, `${targetUser?.first_name} ${targetUser?.last_name}`);
  };

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id_number?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };
  const handleFilter = (v: string) => { setRoleFilter(v); setCurrentPage(1); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf9" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-[14px]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">Manage Users</h1>
          <p className="text-gray-400 text-[14px] mt-1">Manage user roles and access</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <SearchBar value={search} onChange={handleSearch} placeholder="Search by name, email, or ID number..." />
          </div>
          <select value={roleFilter} onChange={(e) => handleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] bg-white text-gray-600 outline-none focus:border-primary cursor-pointer">
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="nurse">Nurse</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <p className="text-[13px] text-gray-400 mb-3">
          Showing {paginated.length} of {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {paginated.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="text-gray-300 mx-auto mb-3" size={40} />
              <p className="text-gray-400 text-[15px]">
                {users.length === 0 ? "No users found" : "No results match your search"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">ID Number</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[13px] font-semibold flex-shrink-0">
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-[14px] text-gray-700 font-medium m-0">{u.first_name} {u.last_name}</p>
                            <p className="text-[12px] text-gray-400 m-0 sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 hidden sm:table-cell">{u.email}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 hidden md:table-cell">{u.id_number}</td>
                      <td className="py-3 px-4">
                        <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="text-[13px] border border-gray-200 rounded-lg py-1.5 px-2.5 outline-none focus:border-primary bg-white text-gray-600 cursor-pointer">
                          <option value="student">Student</option>
                          <option value="nurse">Nurse</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={u.active_status} /></td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleToggleStatus(u.id, u.active_status)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium border-none cursor-pointer transition ${
                            u.active_status === "active"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}>
                          {u.active_status === "active" ? (
                            <><UserXIcon size={14} /> Deactivate</>
                          ) : (
                            <><ShieldIcon size={14} /> Activate</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </main>
    </div>
  );
}
