"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/components/Toast";
import { CheckCircleIcon, XCircleIcon, CalendarIcon, TrashIcon } from "@/components/Icons";

const ITEMS_PER_PAGE = 10;

export default function ManageAppointmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const supabase = createClient();
  const { addToast } = useToast();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUserData } = await supabase.from("users").select("*").eq("auth_id", authUser.id).limit(1);
    setUser(dbUserData?.[0] || null);
    const { data } = await supabase.from("appointments").select("*, users(email)").order("created_at", { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: "Approved" | "Rejected") => {
    setActionLoadingId(id);
    const appt = appointments.find((a) => a.id === id);
    const { error } = await supabase.from("appointments").update({ status: action }).eq("id", id);
    if (error) { addToast("error", "Failed to update"); setActionLoadingId(null); return; }
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: action } : a)));
    addToast("success", `Appointment ${action.toLowerCase()} successfully`);

    // Send email notification
    const email = appt?.users?.email || appt?.email;
    if (email && appt) {
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "status",
            to: email,
            name: `${appt.firstname} ${appt.lastname}`,
            status: action,
            details: { requestType: "appointment", date: appt.appointment_date, purpose: appt.purpose },
          }),
        });
      } catch { /* non-critical */ }
    }
    setActionLoadingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this appointment? This cannot be undone.")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/delete?id=${id}&type=appointment`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { addToast("error", data.error || "Failed to delete"); setActionLoadingId(null); return; }
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      addToast("success", "Appointment deleted permanently");
    } catch { addToast("error", "An unexpected error occurred"); }
    setActionLoadingId(null);
  };

  const filtered = useMemo(() => {
    let result = appointments;
    if (statusFilter !== "all") result = result.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        `${a.firstname} ${a.lastname}`.toLowerCase().includes(q) ||
        a.student_id?.toLowerCase().includes(q) ||
        a.purpose?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [appointments, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };
  const handleFilter = (v: string) => { setStatusFilter(v); setCurrentPage(1); };

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
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">Manage Appointments</h1>
          <p className="text-gray-400 text-[14px] mt-1">View and manage all appointment requests</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <SearchBar value={search} onChange={handleSearch} placeholder="Search by name, ID, or purpose..." />
          </div>
          <select value={statusFilter} onChange={(e) => handleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] bg-white text-gray-600 outline-none focus:border-primary cursor-pointer">
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <p className="text-[13px] text-gray-400 mb-3">
          Showing {paginated.length} of {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {paginated.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon className="text-gray-300 mx-auto mb-3" size={40} />
              <p className="text-gray-400 text-[15px]">
                {appointments.length === 0 ? "No appointments found" : "No results match your search"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Student ID</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Purpose</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((appt) => (
                    <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 text-[14px] text-gray-700">{appt.firstname} {appt.lastname}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 hidden sm:table-cell">{appt.student_id || "N/A"}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 hidden md:table-cell">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-[14px] text-gray-500 max-w-[200px] truncate hidden lg:table-cell">{appt.purpose}</td>
                      <td className="py-3 px-4"><StatusBadge status={appt.status} /></td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          {appt.status === "Pending" && (
                            <>
                              <button onClick={() => handleAction(appt.id, "Approved")} disabled={actionLoadingId === appt.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                {actionLoadingId === appt.id ? <span className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : <CheckCircleIcon size={14} />} {actionLoadingId === appt.id ? "Approving..." : "Approve"}
                              </button>
                              <button onClick={() => handleAction(appt.id, "Rejected")} disabled={actionLoadingId === appt.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                <XCircleIcon size={14} /> Reject
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDelete(appt.id)} disabled={actionLoadingId === appt.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoadingId === appt.id ? <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : <TrashIcon size={14} />} Delete
                          </button>
                        </div>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
