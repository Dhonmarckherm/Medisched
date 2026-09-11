"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/Toast";
import { UsersIcon, ShieldIcon, UserXIcon, PlusIcon, LockIcon, MailIcon, UserIcon, XIcon, TrashIcon } from "@/components/Icons";
import { logActivity } from "@/lib/activityLog";

const ITEMS_PER_PAGE = 10;

export default function ManageUsersPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const supabase = createClient();
  const { addToast } = useToast();

  const isSuperAdmin = user?.is_super_admin === true;

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
    
    // Only super admin can change roles to admin/nurse
    if ((role === "admin" || role === "nurse") && !isSuperAdmin) {
      addToast("error", "Only super admin can assign admin/nurse roles");
      return;
    }

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

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/delete?id=${deleteTarget.id}&type=user`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Failed to delete user");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      addToast("success", `${deleteTarget.first_name} ${deleteTarget.last_name} has been deleted`);
      logActivity("user_deleted", "user", deleteTarget.id, `${deleteTarget.first_name} ${deleteTarget.last_name} (${deleteTarget.role})`);
      setDeleteTarget(null);
    } catch {
      addToast("error", "An unexpected error occurred");
    } finally {
      setDeleteLoading(false);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#1a1a2e] flex items-center gap-2">
              Manage Users
              {isSuperAdmin && (
                <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Super Admin
                </span>
              )}
            </h1>
            <p className="text-gray-400 text-[14px] mt-1">Manage user roles and access</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-[14px] font-medium border-none cursor-pointer hover:bg-primary-hover transition-colors"
            >
              <PlusIcon size={16} /> Create Staff Account
            </button>
          )}
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
                            <p className="text-[14px] text-gray-700 font-medium m-0 flex items-center gap-1.5">
                              {u.first_name} {u.last_name}
                              {u.is_super_admin && (
                                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">SA</span>
                              )}
                            </p>
                            <p className="text-[12px] text-gray-400 m-0 sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 hidden sm:table-cell">{u.email}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 hidden md:table-cell">{u.id_number}</td>
                      <td className="py-3 px-4">
                        <select 
                          value={u.role} 
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          disabled={u.is_super_admin || (!isSuperAdmin && (u.role === "admin" || u.role === "nurse"))}
                          className="text-[13px] border border-gray-200 rounded-lg py-1.5 px-2.5 outline-none focus:border-primary bg-white text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <option value="student">Student</option>
                          <option value="nurse">Nurse</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={u.active_status} /></td>
                      <td className="py-3 px-4">
                        {u.is_super_admin ? (
                          <span className="text-[12px] text-gray-400 italic">Protected</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
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
                            <button onClick={() => setDeleteTarget(u)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-red-50 text-red-500 border-none cursor-pointer hover:bg-red-100 transition"
                              title="Delete user">
                              <TrashIcon size={14} />
                            </button>
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

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </main>

      {/* Create Staff Account Modal */}
      {showCreateModal && (
        <CreateStaffModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newUser) => {
            setUsers(prev => [newUser, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !deleteLoading && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-[90%] max-w-[400px] shadow-xl animate-scale-in">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="text-red-500" size={28} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#1a1a2e] mb-1.5">Delete User?</h3>
              <p className="text-[13px] text-gray-500 mb-1">
                This will permanently delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong>
              </p>
              <p className="text-[12px] text-red-500 mb-5">
                All their appointments and certificates will also be deleted. This cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 bg-white cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleDeleteUser} disabled={deleteLoading}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[13px] font-medium border-none cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50">
                  {deleteLoading ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Create Staff Modal ── */
function CreateStaffModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: any) => void }) {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "nurse",
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      addToast("error", "Please fill in all required fields");
      return;
    }
    if (formData.password.length < 6) {
      addToast("error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/create-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Failed to create account");
        return;
      }
      addToast("success", `${formData.role === "admin" ? "Admin" : "Nurse"} account created! Welcome email sent.`);
      logActivity("staff_created", "user", data.user?.id, `${data.user?.first_name} ${data.user?.last_name} (${formData.role})`);
      onSuccess(data.user);
    } catch {
      addToast("error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-[90%] max-w-[440px] shadow-xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div>
            <h3 className="text-[18px] font-semibold text-[#1a1a2e] m-0">Create Staff Account</h3>
            <p className="text-[12px] text-gray-400 mt-0.5 m-0">Add a new admin or nurse</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <XIcon size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">First Name *</label>
              <div className="flex items-center border border-slate-200 rounded-lg px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <UserIcon className="text-gray-400 mr-2" size={16} />
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full py-2.5 border-none outline-none text-[14px] bg-transparent" placeholder="First" required />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Last Name *</label>
              <div className="flex items-center border border-slate-200 rounded-lg px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <UserIcon className="text-gray-400 mr-2" size={16} />
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full py-2.5 border-none outline-none text-[14px] bg-transparent" placeholder="Last" required />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Email *</label>
            <div className="flex items-center border border-slate-200 rounded-lg px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <MailIcon className="text-gray-400 mr-2" size={16} />
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full py-2.5 border-none outline-none text-[14px] bg-transparent" placeholder="staff@email.com" required />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Password *</label>
            <div className="flex items-center border border-slate-200 rounded-lg px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <LockIcon className="text-gray-400 mr-2" size={16} />
              <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full py-2.5 border-none outline-none text-[14px] bg-transparent" placeholder="Min 6 characters" required minLength={6} />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Role *</label>
            <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full py-2.5 border border-slate-200 rounded-lg px-3 text-[14px] bg-white text-gray-700 outline-none focus:border-primary">
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-[13px] font-medium border-none cursor-pointer hover:bg-primary-hover transition-colors disabled:opacity-50">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
