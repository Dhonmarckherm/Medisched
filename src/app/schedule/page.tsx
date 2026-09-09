"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { CalendarIcon, ClockIcon } from "@/components/Icons";

export default function SchedulePage() {
  const [user, setUser] = useState<any>(null);
  const [accommodation, setAccommodation] = useState<any>(null);
  const [formData, setFormData] = useState({ available_from: "", available_to: "" });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { addToast } = useToast();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", authUser.id).single();
    setUser(dbUser);
    const { data } = await supabase.from("accommodations").select("*").eq("status", "active").order("id", { ascending: false }).limit(1).maybeSingle();
    setAccommodation(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.available_to < formData.available_from) {
      addToast("error", "End date must be after start date");
      return;
    }

    await supabase.from("accommodations").update({ status: "inactive" }).eq("status", "active");
    const { error: insertError } = await supabase.from("accommodations").insert({
      available_from: formData.available_from, available_to: formData.available_to, status: "active",
    });

    if (insertError) { addToast("error", "Failed to save schedule"); return; }

    addToast("success", "Schedule saved successfully!");
    fetchData();
  };

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

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">Clinic Schedule</h1>
          <p className="text-gray-400 text-[14px] mt-1">Manage clinic availability schedule</p>
        </div>

        {/* Current Schedule */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-[16px] font-semibold text-[#1a1a2e] mb-4">Current Schedule</h2>
          {accommodation ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 m-0">Available From</p>
                  <p className="text-[14px] font-medium text-gray-700 m-0">{new Date(accommodation.available_from).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 m-0">Available To</p>
                  <p className="text-[14px] font-medium text-gray-700 m-0">{new Date(accommodation.available_to).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <ClockIcon size={20} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 m-0">Status</p>
                  <StatusBadge status={accommodation.status} />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-[14px] text-center py-6">No active schedule set</p>
          )}
        </div>

        {/* Set New Schedule (Admin only) */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-[16px] font-semibold text-[#1a1a2e] mb-6">Set New Schedule</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-medium text-gray-500 mb-1.5 block">Available From</label>
                  <input type="date" value={formData.available_from} onChange={(e) => setFormData({ ...formData, available_from: e.target.value })} required
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-gray-500 mb-1.5 block">Available To</label>
                  <input type="date" value={formData.available_to} onChange={(e) => setFormData({ ...formData, available_to: e.target.value })} required
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
                </div>
              </div>
              <button type="submit"
                className="w-full py-3 bg-primary text-white border-none rounded-lg text-[14px] font-medium cursor-pointer mt-6 hover:bg-primary-hover transition">
                Save Schedule
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
