"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

export default function SchedulePage() {
  const [user, setUser] = useState<any>(null);
  const [accommodation, setAccommodation] = useState<any>(null);
  const [formData, setFormData] = useState({ available_from: "", available_to: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: dbUser } = await supabase
      .from("users").select("*").eq("auth_id", authUser.id).single();
    setUser(dbUser);

    const { data } = await supabase
      .from("accommodations")
      .select("*")
      .eq("status", "active")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    setAccommodation(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.available_to < formData.available_from) {
      setError("End date must be after start date");
      return;
    }

    await supabase.from("accommodations").update({ status: "inactive" }).eq("status", "active");

    const { error: insertError } = await supabase
      .from("accommodations")
      .insert({ available_from: formData.available_from, available_to: formData.available_to, status: "active" });

    if (insertError) {
      setError("Failed to save schedule");
      return;
    }

    setSuccess("Schedule saved successfully!");
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f8fb" }}>Loading...</div>;

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 flex justify-center">
        <div className="w-[900px] max-w-full bg-white border-[3px] border-primary rounded-[20px] overflow-hidden shadow-lg">
          {/* Form Header */}
          <div className="bg-primary text-white text-center py-6 px-5">
            <h2 className="text-[30px] font-bold m-0">Clinic Schedule</h2>
            <p className="mt-2 text-[14px] opacity-90">Manage clinic availability schedule</p>
          </div>

          <div className="p-[35px]">
            {error && <div className="bg-[#f8d7da] text-[#842029] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#dc3545]">{error}</div>}
            {success && <div className="bg-[#d1e7dd] text-[#0f5132] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#198754]">{success}</div>}

            {accommodation ? (
              <div className="bg-[#f4f8f5] rounded-[10px] p-5 mb-6">
                <h3 className="text-[14px] font-semibold text-[#555] mb-3">Current Schedule</h3>
                <div className="grid grid-cols-1 gap-3 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[#555]">Available From:</span>
                    <span className="font-semibold">{new Date(accommodation.available_from).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Available To:</span>
                    <span className="font-semibold">{new Date(accommodation.available_to).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#555]">Status:</span>
                    <StatusBadge status={accommodation.status} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[#555] text-center py-8 mb-6">No active schedule set</p>
            )}

            {isAdmin && (
              <div>
                <h3 className="text-[18px] font-semibold text-[#333] mb-4">Set New Schedule</h3>
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col mb-5">
                    <label className="mb-2 font-semibold text-[#333] text-[15px]">Available From</label>
                    <input type="date" value={formData.available_from}
                      onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                      required
                      className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                  </div>
                  <div className="flex flex-col mb-5">
                    <label className="mb-2 font-semibold text-[#333] text-[15px]">Available To</label>
                    <input type="date" value={formData.available_to}
                      onChange={(e) => setFormData({ ...formData, available_to: e.target.value })}
                      required
                      className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                  </div>
                  <button type="submit"
                    className="w-full py-4 bg-primary text-white border-none rounded-[10px] text-[16px] font-semibold cursor-pointer hover:bg-primary-hover hover:-translate-y-0.5 transition">
                    Save Schedule
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
