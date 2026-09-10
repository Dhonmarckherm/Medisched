"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { CalendarIcon, CertificateIcon, UsersIcon, ClockIcon, ChartIcon } from "@/components/Icons";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COURSES = ["BSIT", "BSHM", "BSTM", "BSED"];
const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-400",
  Approved: "bg-emerald-500",
  Rejected: "bg-red-400",
};

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", authUser.id).single();
      if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "nurse")) return;
      setUser(dbUser);

      const [{ data: appts }, { data: certs }, { data: allUsers }] = await Promise.all([
        supabase.from("appointments").select("*").order("created_at", { ascending: true }),
        supabase.from("certificates").select("*").order("created_at", { ascending: true }),
        supabase.from("users").select("id, course, role, created_at"),
      ]);
      setAppointments(appts || []);
      setCertificates(certs || []);
      setUsers(allUsers || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Monthly data for the last 6 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { label: string; appointments: number; certificates: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const apptCount = appointments.filter((a) => {
        const ad = new Date(a.created_at);
        return ad.getMonth() === m && ad.getFullYear() === y;
      }).length;
      const certCount = certificates.filter((c) => {
        const cd = new Date(c.created_at);
        return cd.getMonth() === m && cd.getFullYear() === y;
      }).length;
      months.push({ label: MONTHS_SHORT[m], appointments: apptCount, certificates: certCount });
    }
    return months;
  }, [appointments, certificates]);

  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.appointments, m.certificates)), 1);

  // Status breakdown
  const statusData = useMemo(() => {
    const all = [...appointments, ...certificates];
    return {
      Pending: all.filter((i) => i.status === "Pending").length,
      Approved: all.filter((i) => i.status === "Approved").length,
      Rejected: all.filter((i) => i.status === "Rejected").length,
    };
  }, [appointments, certificates]);

  const totalStatus = statusData.Pending + statusData.Approved + statusData.Rejected || 1;

  // Course breakdown
  const courseData = useMemo(() => {
    return COURSES.map((course) => ({
      course,
      appointments: appointments.filter((a) => a.course === course).length,
      certificates: certificates.filter((c) => c.course === course).length,
    }));
  }, [appointments, certificates]);

  const maxCourse = Math.max(...courseData.map((c) => c.appointments + c.certificates), 1);

  // Top purposes
  const topPurposes = useMemo(() => {
    const purposeMap: Record<string, number> = {};
    [...appointments, ...certificates].forEach((item) => {
      const p = item.purpose || "Other";
      purposeMap[p] = (purposeMap[p] || 0) + 1;
    });
    return Object.entries(purposeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [appointments, certificates]);

  const maxPurpose = topPurposes[0]?.[1] || 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faf9" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-[14px]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">Analytics</h1>
          <p className="text-gray-400 text-[14px] mt-1">System usage overview and insights</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <UsersIcon size={20} />
            </div>
            <p className="text-[24px] font-bold text-[#1a1a2e]">{users.filter((u) => u.role === "student").length}</p>
            <p className="text-gray-400 text-[13px]">Total Students</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CalendarIcon size={20} />
            </div>
            <p className="text-[24px] font-bold text-[#1a1a2e]">{appointments.length}</p>
            <p className="text-gray-400 text-[13px]">Total Appointments</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <CertificateIcon size={20} />
            </div>
            <p className="text-[24px] font-bold text-[#1a1a2e]">{certificates.length}</p>
            <p className="text-gray-400 text-[13px]">Total Certificates</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <ClockIcon size={20} />
            </div>
            <p className="text-[24px] font-bold text-[#1a1a2e]">{statusData.Pending}</p>
            <p className="text-gray-400 text-[13px]">Pending Items</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <ChartIcon size={18} className="text-primary" />
              <h3 className="text-[15px] font-semibold text-[#1a1a2e]">Monthly Trend (Last 6 Months)</h3>
            </div>
            <div className="flex items-end gap-3 h-[200px]">
              {monthlyData.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex gap-1 items-end justify-center" style={{ height: "170px" }}>
                    <div
                      className="w-[40%] bg-primary/80 rounded-t-md transition-all duration-500"
                      style={{ height: `${(m.appointments / maxMonthly) * 100}%`, minHeight: m.appointments > 0 ? "4px" : "0" }}
                      title={`${m.appointments} appointments`}
                    />
                    <div
                      className="w-[40%] bg-purple-400 rounded-t-md transition-all duration-500"
                      style={{ height: `${(m.certificates / maxMonthly) * 100}%`, minHeight: m.certificates > 0 ? "4px" : "0" }}
                      title={`${m.certificates} certificates`}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary/80" />
                <span className="text-[12px] text-gray-500">Appointments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-purple-400" />
                <span className="text-[12px] text-gray-500">Certificates</span>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <ChartIcon size={18} className="text-primary" />
              <h3 className="text-[15px] font-semibold text-[#1a1a2e]">Status Breakdown</h3>
            </div>
            {/* Donut-style ring */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-[160px] h-[160px]">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {(() => {
                    let offset = 0;
                    const entries = Object.entries(statusData) as [string, number][];
                    const colors: Record<string, string> = { Pending: "#f59e0b", Approved: "#10b981", Rejected: "#ef4444" };
                    return entries.map(([status, count]) => {
                      const pct = (count / totalStatus) * 100;
                      const dashArray = `${pct} ${100 - pct}`;
                      const el = (
                        <circle
                          key={status}
                          cx="18" cy="18" r="15.915"
                          fill="none"
                          stroke={colors[status]}
                          strokeWidth="3"
                          strokeDasharray={dashArray}
                          strokeDashoffset={`${100 - offset}`}
                          className="transition-all duration-500"
                        />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[28px] font-bold text-[#1a1a2e]">{totalStatus > 1 ? totalStatus : appointments.length + certificates.length}</span>
                  <span className="text-[11px] text-gray-400">Total</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(statusData).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`} />
                    <span className="text-[13px] text-gray-600">{status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${STATUS_COLORS[status]} transition-all duration-500`}
                        style={{ width: `${(count / totalStatus) * 100}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-semibold text-[#1a1a2e] w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <UsersIcon size={18} className="text-primary" />
              <h3 className="text-[15px] font-semibold text-[#1a1a2e]">By Course</h3>
            </div>
            <div className="space-y-4">
              {courseData.map((c) => {
                const total = c.appointments + c.certificates;
                return (
                  <div key={c.course}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-gray-700">{c.course}</span>
                      <span className="text-[12px] text-gray-400">{total} total</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-primary/80 transition-all duration-500"
                        style={{ width: `${(c.appointments / maxCourse) * 100}%` }}
                      />
                      <div
                        className="h-full bg-purple-400 transition-all duration-500"
                        style={{ width: `${(c.certificates / maxCourse) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary/80" />
                <span className="text-[12px] text-gray-500">Appointments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-purple-400" />
                <span className="text-[12px] text-gray-500">Certificates</span>
              </div>
            </div>
          </div>

          {/* Top Purposes */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <ChartIcon size={18} className="text-primary" />
              <h3 className="text-[15px] font-semibold text-[#1a1a2e]">Top Purposes</h3>
            </div>
            {topPurposes.length === 0 ? (
              <p className="text-gray-400 text-[13px] text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-4">
                {topPurposes.map(([purpose, count], i) => (
                  <div key={purpose}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-gray-700 truncate max-w-[200px]">{purpose}</span>
                      <span className="text-[12px] text-gray-400">{count}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / maxPurpose) * 100}%`,
                          background: i === 0 ? "#2e8b57" : i === 1 ? "#3b82f6" : i === 2 ? "#8b5cf6" : i === 3 ? "#f59e0b" : "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
