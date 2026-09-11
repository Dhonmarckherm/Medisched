"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { DownloadIcon, DatabaseIcon, ShieldIcon, CalendarIcon, CertificateIcon, UsersIcon, CheckCircleIcon } from "@/components/Icons";

export default function BackupPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: dbUserData } = await supabase.from("users").select("*").eq("auth_id", authUser.id).limit(1);
      const dbUser = dbUserData?.[0] || null;
      if (!dbUser || dbUser.role !== "admin") return;
      setUser(dbUser);

      // Fetch stats
      const res = await fetch("/api/backup");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }

      // Check last backup from activity logs
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("created_at")
        .eq("action", "database_backup")
        .order("created_at", { ascending: false })
        .limit(1);
      if (logs && logs.length > 0) {
        setLastBackup(logs[0].created_at);
      }

      setLoading(false);
    };
    init();
  }, []);

  const handleBackup = async () => {
    setBacking(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (res.ok) {
        const { backup } = await res.json();
        // Download as JSON file
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date().toISOString().split("T")[0];
        link.download = `medisched-backup-${date}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setLastBackup(new Date().toISOString());
        setStats(backup.stats);
      }
    } catch (error) {
      console.error("Backup failed:", error);
    } finally {
      setBacking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-[14px]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">Database Backup</h1>
          <p className="text-gray-400 text-[14px] mt-1">Export and download your system data</p>
        </div>

        {/* Backup Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <DatabaseIcon size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#111] m-0">Create Backup</h2>
              <p className="text-[12px] text-gray-400 m-0">Download all system data as JSON</p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50/50 rounded-lg p-3 text-center border border-blue-100/50">
                <UsersIcon size={16} className="text-blue-500 mx-auto mb-1" />
                <p className="text-[18px] font-bold text-[#1a1a2e] m-0">{stats.total_users}</p>
                <p className="text-[11px] text-gray-400 m-0">Users</p>
              </div>
              <div className="bg-emerald-50/50 rounded-lg p-3 text-center border border-emerald-100/50">
                <CalendarIcon size={16} className="text-emerald-500 mx-auto mb-1" />
                <p className="text-[18px] font-bold text-[#1a1a2e] m-0">{stats.total_appointments}</p>
                <p className="text-[11px] text-gray-400 m-0">Appointments</p>
              </div>
              <div className="bg-purple-50/50 rounded-lg p-3 text-center border border-purple-100/50">
                <CertificateIcon size={16} className="text-purple-500 mx-auto mb-1" />
                <p className="text-[18px] font-bold text-[#1a1a2e] m-0">{stats.total_certificates}</p>
                <p className="text-[11px] text-gray-400 m-0">Certificates</p>
              </div>
            </div>
          )}

          {/* Last Backup */}
          {lastBackup && (
            <div className="flex items-center gap-2 mb-4 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
              <CheckCircleIcon size={14} className="text-green-600" />
              <span className="text-[12px] text-green-700">
                Last backup: {new Date(lastBackup).toLocaleString()}
              </span>
            </div>
          )}

          <button
            onClick={handleBackup}
            disabled={backing}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white border-none rounded-lg px-6 py-3 text-[14px] font-medium cursor-pointer hover:bg-primary-hover transition disabled:opacity-50"
          >
            <DownloadIcon size={16} />
            {backing ? "Creating Backup..." : "Download Backup"}
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldIcon size={18} className="text-primary" />
            <h3 className="text-[15px] font-semibold text-[#1a1a2e] m-0">Backup Information</h3>
          </div>
          <div className="space-y-3 text-[13px] text-gray-500 leading-relaxed">
            <p className="m-0">
              <strong className="text-gray-700">What&apos;s included:</strong> All users, appointments, certificates, accommodations, and recent activity logs.
            </p>
            <p className="m-0">
              <strong className="text-gray-700">Format:</strong> JSON file — can be used to restore data or migrate to another system.
            </p>
            <p className="m-0">
              <strong className="text-gray-700">Recommendation:</strong> Create backups weekly or before making major changes to the system.
            </p>
            <p className="m-0">
              <strong className="text-gray-700">Security:</strong> Backup files contain sensitive data. Store them securely and delete when no longer needed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
