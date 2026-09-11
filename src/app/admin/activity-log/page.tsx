"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Pagination } from "@/components/Pagination";
import { ShieldIcon, CalendarIcon, CertificateIcon, UsersIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from "@/components/Icons";

const ITEMS_PER_PAGE = 20;

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "appointment_approved": { label: "Approved Appointment", color: "bg-emerald-50 text-emerald-700", icon: <CheckCircleIcon size={14} /> },
  "appointment_rejected": { label: "Rejected Appointment", color: "bg-red-50 text-red-700", icon: <XCircleIcon size={14} /> },
  "appointment_deleted": { label: "Deleted Appointment", color: "bg-gray-100 text-gray-600", icon: <TrashIcon size={14} /> },
  "appointment_cancelled": { label: "Cancelled Appointment", color: "bg-amber-50 text-amber-700", icon: <XCircleIcon size={14} /> },
  "certificate_approved": { label: "Approved Certificate", color: "bg-emerald-50 text-emerald-700", icon: <CheckCircleIcon size={14} /> },
  "certificate_rejected": { label: "Rejected Certificate", color: "bg-red-50 text-red-700", icon: <XCircleIcon size={14} /> },
  "certificate_deleted": { label: "Deleted Certificate", color: "bg-gray-100 text-gray-600", icon: <TrashIcon size={14} /> },
  "certificate_cancelled": { label: "Cancelled Certificate", color: "bg-amber-50 text-amber-700", icon: <XCircleIcon size={14} /> },
  "role_changed": { label: "Changed User Role", color: "bg-blue-50 text-blue-700", icon: <UsersIcon size={14} /> },
  "user_activated": { label: "Activated User", color: "bg-emerald-50 text-emerald-700", icon: <UsersIcon size={14} /> },
  "user_deactivated": { label: "Deactivated User", color: "bg-amber-50 text-amber-700", icon: <UsersIcon size={14} /> },
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || { label: action, color: "bg-gray-100 text-gray-600", icon: <ShieldIcon size={14} /> };
}

export default function ActivityLogPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: dbUserData } = await supabase.from("users").select("*").eq("auth_id", authUser.id).limit(1);
      const dbUser = dbUserData?.[0] || null;
      setUser(dbUser);
      if (dbUser?.role !== "admin" && dbUser?.role !== "nurse") return;
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/activity-log?page=${page}`);
        const data = await res.json();
        if (data.data) {
          setLogs(data.data);
          setTotal(data.total || 0);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchLogs();
  }, [user, page]);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.action === filter);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (loading && !user) {
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
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">Activity Log</h1>
          <p className="text-gray-400 text-[14px] mt-1">Track all admin actions and system events</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium border-none cursor-pointer transition whitespace-nowrap ${filter === "all" ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
            All Activity
          </button>
          {uniqueActions.map((action) => {
            const config = getActionConfig(action);
            return (
              <button key={action} onClick={() => setFilter(action)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border-none cursor-pointer transition whitespace-nowrap ${filter === action ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
                {config.icon} {config.label}
              </button>
            );
          })}
        </div>

        <p className="text-[13px] text-gray-400 mb-3">
          {total} total activit{total !== 1 ? "ies" : "y"}
        </p>

        {/* Log List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldIcon className="text-gray-300 mx-auto mb-3" size={40} />
              <p className="text-gray-400 text-[15px]">
                {logs.length === 0 ? "No activity recorded yet" : "No results match this filter"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredLogs.map((log) => {
                const config = getActionConfig(log.action);
                return (
                  <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition">
                    <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 m-0">
                        <span className="font-semibold">{log.user_name}</span>
                        <span className="text-gray-400"> — </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </p>
                      {log.details && (
                        <p className="text-[12px] text-gray-400 m-0 mt-0.5 truncate">{log.details}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-gray-300 capitalize">{log.user_role}</span>
                      <span className="text-[12px] text-gray-300">{formatTime(log.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </main>
    </div>
  );
}
