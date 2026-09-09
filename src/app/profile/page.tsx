"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    id_number: "",
    course: "",
    year_level: "",
    contact_number: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: dbUser } = await supabase
        .from("users").select("*").eq("auth_id", authUser.id).single();
      if (dbUser) {
        setUser(dbUser);
        setFormData({
          first_name: dbUser.first_name || "",
          last_name: dbUser.last_name || "",
          middle_name: dbUser.middle_name || "",
          id_number: dbUser.id_number || "",
          course: dbUser.course || "",
          year_level: dbUser.year_level || "",
          contact_number: dbUser.contact_number || "",
          email: dbUser.email || "",
        });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", formData.email)
        .neq("id", user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        setError("Email is already taken by another user");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name || null,
          id_number: formData.id_number,
          course: formData.course || null,
          year_level: formData.year_level || null,
          contact_number: formData.contact_number || null,
          email: formData.email,
        })
        .eq("id", user.id);

      if (updateError) {
        setError("Failed to update profile");
        setSaving(false);
        return;
      }

      setSuccess("Profile updated successfully!");
      setUser({ ...user, ...formData });
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f8fb" }}>Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 flex justify-center">
        <div className="w-[900px] max-w-full bg-white border-[3px] border-primary rounded-[20px] overflow-hidden shadow-lg">
          {/* Form Header */}
          <div className="bg-primary text-white text-center py-6 px-5">
            <h2 className="text-[30px] font-bold m-0">My Profile</h2>
            <p className="mt-2 text-[14px] opacity-90">View and update your personal information</p>
          </div>

          <div className="p-[35px]">
            {error && <div className="bg-[#f8d7da] text-[#842029] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#dc3545]">{error}</div>}
            {success && <div className="bg-[#d1e7dd] text-[#0f5132] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#198754]">{success}</div>}

            {/* Read-only info */}
            <div className="bg-[#f4f8f5] rounded-[10px] p-5 mb-6">
              <h3 className="text-[14px] font-semibold text-[#555] mb-3">Account Information</h3>
              <div className="grid grid-cols-3 gap-4 text-[14px]">
                <div><span className="text-[#555]">Role:</span> <StatusBadge status={user.role} /></div>
                <div><span className="text-[#555]">Status:</span> <StatusBadge status={user.active_status} /></div>
                <div><span className="text-[#555]">Joined:</span> <span className="font-semibold">{new Date(user.created_at).toLocaleDateString()}</span></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">First Name</label>
                  <input type="text" value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Last Name</label>
                  <input type="text" value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
              </div>
              <div className="flex flex-col mt-5">
                <label className="mb-2 font-semibold text-[#333] text-[15px]">Middle Name</label>
                <input type="text" value={formData.middle_name}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
              </div>
              <div className="grid grid-cols-2 gap-5 mt-5">
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">ID Number</label>
                  <input type="text" value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    required
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Course</label>
                  <input type="text" value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 mt-5">
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Year Level</label>
                  <input type="text" value={formData.year_level}
                    onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Contact Number</label>
                  <input type="text" value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
              </div>
              <div className="flex flex-col mt-5">
                <label className="mb-2 font-semibold text-[#333] text-[15px]">Email</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-4 bg-primary text-white border-none rounded-[10px] text-[16px] font-semibold cursor-pointer mt-5 hover:bg-primary-hover hover:-translate-y-0.5 transition disabled:opacity-50">
                {saving ? "Saving..." : "Update Profile"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
