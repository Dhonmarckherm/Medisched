"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { SearchBar } from "@/components/SearchBar";
import { useToast } from "@/components/Toast";
import { CheckCircleIcon, XCircleIcon, CalendarIcon, CertificateIcon, CheckSquareIcon, TrashIcon } from "@/components/Icons";

export default function PendingListPage() {
  const [user, setUser] = useState<any>(null);
  const [pendingAppts, setPendingAppts] = useState<any[]>([]);
  const [pendingCerts, setPendingCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"appointments" | "certificates">("appointments");
  const [selectedApptIds, setSelectedApptIds] = useState<Set<string>>(new Set());
  const [selectedCertIds, setSelectedCertIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const supabase = createClient();
  const { addToast } = useToast();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUserData } = await supabase.from("users").select("*").eq("auth_id", authUser.id).limit(1);
    const dbUser = dbUserData?.[0] || null;
    setUser(dbUser);

    const isAdminOrNurse = dbUser?.role === "admin" || dbUser?.role === "nurse";

    let apptQ = supabase.from("appointments").select("*, users(email)").eq("status", "Pending").order("created_at", { ascending: false });
    let certQ = supabase.from("certificates").select("*, users(email)").eq("status", "Pending").order("created_at", { ascending: false });

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

  const sendEmail = async (email: string, name: string, type: "appointment" | "certificate", status: "Approved" | "Rejected", details?: Record<string, string>) => {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "status", to: email, name, status, details: { requestType: type, ...details } }),
      });
    } catch { /* email is non-critical, don't block UI */ }
  };

  const handleAction = async (id: string, type: "appointment" | "certificate", action: "Approved" | "Rejected") => {
    setActionLoadingId(id);
    const table = type === "appointment" ? "appointments" : "certificates";
    const item = [...pendingAppts, ...pendingCerts].find((i) => i.id === id);
    const { error } = await supabase.from(table).update({ status: action }).eq("id", id);

    if (error) {
      addToast("error", `Failed to ${action === "Approved" ? "approve" : "reject"} item`);
      setActionLoadingId(null);
      return;
    }

    // Send email notification
    if (item?.email || item?.users?.email) {
      const email = item.email || item.users?.email;
      const name = `${item.firstname} ${item.lastname}`;
      const date = type === "appointment" ? item.appointment_date : item.date_needed;
      await sendEmail(email, name, type, action, { date, purpose: item.purpose });
    }

    if (type === "appointment") {
      setPendingAppts((prev) => prev.filter((a) => a.id !== id));
    } else {
      setPendingCerts((prev) => prev.filter((c) => c.id !== id));
    }
    addToast("success", `${type === "appointment" ? "Appointment" : "Certificate"} ${action.toLowerCase()} successfully`);
    setActionLoadingId(null);
  };

  const handleDelete = async (id: string, type: "appointment" | "certificate") => {
    if (!confirm(`Are you sure you want to permanently delete this ${type}? This cannot be undone.`)) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/delete?id=${id}&type=${type}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { addToast("error", data.error || "Failed to delete"); setActionLoadingId(null); return; }
      if (type === "appointment") {
        setPendingAppts((prev) => prev.filter((a) => a.id !== id));
      } else {
        setPendingCerts((prev) => prev.filter((c) => c.id !== id));
      }
      addToast("success", `${type === "appointment" ? "Appointment" : "Certificate"} deleted permanently`);
    } catch { addToast("error", "An unexpected error occurred"); }
    setActionLoadingId(null);
  };

  const toggleApptSelect = (id: string) => {
    setSelectedApptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCertSelect = (id: string) => {
    setSelectedCertIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllAppts = () => {
    if (selectedApptIds.size === filteredAppts.length) {
      setSelectedApptIds(new Set());
    } else {
      setSelectedApptIds(new Set(filteredAppts.map((a) => a.id)));
    }
  };

  const toggleAllCerts = () => {
    if (selectedCertIds.size === filteredCerts.length) {
      setSelectedCertIds(new Set());
    } else {
      setSelectedCertIds(new Set(filteredCerts.map((c) => c.id)));
    }
  };

  const handleBulkAction = async (action: "Approved" | "Rejected") => {
    const ids = tab === "appointments" ? [...selectedApptIds] : [...selectedCertIds];
    if (ids.length === 0) return;
    setBulkLoading(true);

    const table = tab === "appointments" ? "appointments" : "certificates";
    const items = tab === "appointments"
      ? pendingAppts.filter((a) => selectedApptIds.has(a.id))
      : pendingCerts.filter((c) => selectedCertIds.has(c.id));

    const { error } = await supabase.from(table)
      .update({ status: action })
      .in("id", ids);

    if (error) {
      addToast("error", `Failed to ${action === "Approved" ? "approve" : "reject"} items`);
      setBulkLoading(false);
      return;
    }

    // Send emails for each item
    for (const item of items) {
      const email = item.email || item.users?.email;
      if (email) {
        const name = `${item.firstname} ${item.lastname}`;
        const date = tab === "appointments" ? item.appointment_date : item.date_needed;
        await sendEmail(email, name, tab === "appointments" ? "appointment" : "certificate", action, { date, purpose: item.purpose });
      }
    }

    if (tab === "appointments") {
      setPendingAppts((prev) => prev.filter((a) => !selectedApptIds.has(a.id)));
      setSelectedApptIds(new Set());
    } else {
      setPendingCerts((prev) => prev.filter((c) => !selectedCertIds.has(c.id)));
      setSelectedCertIds(new Set());
    }
    addToast("success", `${ids.length} ${tab} ${action.toLowerCase()} successfully`);
    setBulkLoading(false);
  };

  const filteredAppts = useMemo(() => {
    if (!search.trim()) return pendingAppts;
    const q = search.toLowerCase();
    return pendingAppts.filter((a) =>
      `${a.firstname} ${a.lastname}`.toLowerCase().includes(q) ||
      a.student_id?.toLowerCase().includes(q) ||
      a.purpose?.toLowerCase().includes(q)
    );
  }, [pendingAppts, search]);

  const filteredCerts = useMemo(() => {
    if (!search.trim()) return pendingCerts;
    const q = search.toLowerCase();
    return pendingCerts.filter((c) =>
      `${c.firstname} ${c.lastname}`.toLowerCase().includes(q) ||
      c.student_id?.toLowerCase().includes(q) ||
      c.purpose?.toLowerCase().includes(q)
    );
  }, [pendingCerts, search]);

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

  const isAdminOrNurse = user?.role === "admin" || user?.role === "nurse";

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">Pending Items</h1>
          <p className="text-gray-400 text-[14px] mt-1">Review and manage pending requests</p>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, ID, or purpose..." />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("appointments")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-medium border-none cursor-pointer transition ${
              tab === "appointments" ? "bg-white text-primary shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarIcon size={16} /> Appointments
            <span className="bg-primary/10 text-primary text-[12px] px-1.5 py-0.5 rounded-full">{pendingAppts.length}</span>
          </button>
          <button
            onClick={() => setTab("certificates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-medium border-none cursor-pointer transition ${
              tab === "certificates" ? "bg-white text-primary shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CertificateIcon size={16} /> Certificates
            <span className="bg-primary/10 text-primary text-[12px] px-1.5 py-0.5 rounded-full">{pendingCerts.length}</span>
          </button>
        </div>

        {/* Bulk Action Bar */}
        {isAdminOrNurse && (
          (tab === "appointments" && selectedApptIds.size > 0) || (tab === "certificates" && selectedCertIds.size > 0)
        ) && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 mb-4 flex items-center justify-between animate-scale-in">
            <p className="text-[13px] text-gray-600 font-medium">
              <span className="text-primary font-bold">{tab === "appointments" ? selectedApptIds.size : selectedCertIds.size}</span> item{((tab === "appointments" ? selectedApptIds.size : selectedCertIds.size) > 1) ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction("Approved")} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-emerald-600 transition disabled:opacity-50">
                <CheckCircleIcon size={14} /> Approve All
              </button>
              <button onClick={() => handleBulkAction("Rejected")} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-red-600 transition disabled:opacity-50">
                <XCircleIcon size={14} /> Reject All
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {tab === "appointments" ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filteredAppts.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarIcon className="text-gray-300 mx-auto mb-3" size={40} />
                <p className="text-gray-400 text-[15px]">
                  {pendingAppts.length === 0 ? "No pending appointments" : "No results match your search"}
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
                      {isAdminOrNurse && <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppts.map((appt) => (
                      <tr key={appt.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition ${selectedApptIds.has(appt.id) ? "bg-primary/5" : ""}`}>
                        {isAdminOrNurse && (
                          <td className="py-3 px-4">
                            <input type="checkbox" checked={selectedApptIds.has(appt.id)} onChange={() => toggleApptSelect(appt.id)}
                              className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer" />
                          </td>
                        )}
                        <td className="py-3 px-4 text-[14px] text-gray-700">{appt.firstname} {appt.lastname}</td>
                        <td className="py-3 px-4 text-[14px] text-gray-500 hidden sm:table-cell">{appt.student_id || "N/A"}</td>
                        <td className="py-3 px-4 text-[14px] text-gray-500 hidden md:table-cell">{new Date(appt.appointment_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-[14px] text-gray-500 max-w-[200px] truncate hidden lg:table-cell">{appt.purpose}</td>
                        <td className="py-3 px-4"><StatusBadge status={appt.status} /></td>
                        {isAdminOrNurse && (
                          <td className="py-3 px-4">
                            <div className="flex gap-1.5">
                              <button onClick={() => handleAction(appt.id, "appointment", "Approved")} disabled={actionLoadingId === appt.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Approve">
                                {actionLoadingId === appt.id ? <span className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : <CheckCircleIcon size={14} />} {actionLoadingId === appt.id ? "Approving..." : "Approve"}
                              </button>
                              <button onClick={() => handleAction(appt.id, "appointment", "Rejected")} disabled={actionLoadingId === appt.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject">
                                <XCircleIcon size={14} /> Reject
                              </button>
                              <button onClick={() => handleDelete(appt.id, "appointment")} disabled={actionLoadingId === appt.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete">
                                {actionLoadingId === appt.id ? <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : <TrashIcon size={14} />} Delete
                              </button>
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
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filteredCerts.length === 0 ? (
              <div className="p-12 text-center">
                <CertificateIcon className="text-gray-300 mx-auto mb-3" size={40} />
                <p className="text-gray-400 text-[15px]">
                  {pendingCerts.length === 0 ? "No pending certificates" : "No results match your search"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {isAdminOrNurse && (
                        <th className="py-3 px-4 w-10">
                          <input type="checkbox" checked={selectedCertIds.size === filteredCerts.length && filteredCerts.length > 0} onChange={toggleAllCerts}
                            className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer" />
                        </th>
                      )}
                      <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Student ID</th>
                      <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date Needed</th>
                      <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Purpose</th>
                      <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      {isAdminOrNurse && <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCerts.map((cert) => (
                      <tr key={cert.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition ${selectedCertIds.has(cert.id) ? "bg-primary/5" : ""}`}>
                        {isAdminOrNurse && (
                          <td className="py-3 px-4">
                            <input type="checkbox" checked={selectedCertIds.has(cert.id)} onChange={() => toggleCertSelect(cert.id)}
                              className="w-4 h-4 rounded border-gray-300 accent-primary cursor-pointer" />
                          </td>
                        )}
                        <td className="py-3 px-4 text-[14px] text-gray-700">{cert.firstname} {cert.lastname}</td>
                        <td className="py-3 px-4 text-[14px] text-gray-500 hidden sm:table-cell">{cert.student_id || "N/A"}</td>
                        <td className="py-3 px-4 text-[14px] text-gray-500 hidden md:table-cell">{new Date(cert.date_needed).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-[14px] text-gray-500 max-w-[200px] truncate hidden lg:table-cell">{cert.purpose}</td>
                        <td className="py-3 px-4"><StatusBadge status={cert.status} /></td>
                        {isAdminOrNurse && (
                          <td className="py-3 px-4">
                            <div className="flex gap-1.5">
                              <button onClick={() => handleAction(cert.id, "certificate", "Approved")} disabled={actionLoadingId === cert.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                {actionLoadingId === cert.id ? <span className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : <CheckCircleIcon size={14} />} {actionLoadingId === cert.id ? "Approving..." : "Approve"}
                              </button>
                              <button onClick={() => handleAction(cert.id, "certificate", "Rejected")} disabled={actionLoadingId === cert.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                <XCircleIcon size={14} /> Reject
                              </button>
                              <button onClick={() => handleDelete(cert.id, "certificate")} disabled={actionLoadingId === cert.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-[12px] font-medium border-none cursor-pointer hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete">
                                {actionLoadingId === cert.id ? <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} /> : <TrashIcon size={14} />} Delete
                              </button>
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
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
