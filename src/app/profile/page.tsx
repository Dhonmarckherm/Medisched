"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { UserIcon, MailIcon, IdCardIcon, CalendarIcon, BookIcon, PhoneIcon } from "@/components/Icons";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", middle_name: "", id_number: "",
    course: "", year_level: "", contact_number: "", email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", authUser.id).single();
      if (dbUser) {
        setUser(dbUser);
        setFormData({
          first_name: dbUser.first_name || "", last_name: dbUser.last_name || "",
          middle_name: dbUser.middle_name || "", id_number: dbUser.id_number || "",
          course: dbUser.course || "", year_level: dbUser.year_level || "",
          contact_number: dbUser.contact_number || "", email: dbUser.email || "",
        });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: existing } = await supabase.from("users").select("id").eq("email", formData.email).neq("id", user.id).limit(1);
      if (existing && existing.length > 0) {
        addToast("error", "Email is already taken by another user");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.from("users").update({
        first_name: formData.first_name, last_name: formData.last_name,
        middle_name: formData.middle_name || null, id_number: formData.id_number,
        course: formData.course || null, year_level: formData.year_level || null,
        contact_number: formData.contact_number || null, email: formData.email,
      }).eq("id", user.id);

      if (updateError) { addToast("error", "Failed to update profile"); setSaving(false); return; }

      addToast("success", "Profile updated successfully!");
      setUser({ ...user, ...formData });
    } catch {
      addToast("error", "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
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
  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#f8faf9" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1a1a2e]">My Profile</h1>
          <p className="text-gray-400 text-[14px] mt-1">View and update your personal information</p>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="text-[16px] font-semibold text-[#1a1a2e] mb-4">Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-400">Role:</span>
              <StatusBadge status={user.role} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-400">Status:</span>
              <StatusBadge status={user.active_status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-400">Joined:</span>
              <span className="text-[14px] font-medium text-gray-600">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-[16px] font-semibold text-[#1a1a2e] mb-6">Personal Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-1.5">
                  <UserIcon size={14} /> First Name
                </label>
                <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-1.5">
                  <UserIcon size={14} /> Last Name
                </label>
                <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-1.5">
                <UserIcon size={14} /> Middle Name
              </label>
              <input type="text" value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-1.5">
                  <IdCardIcon size={14} /> ID Number
                </label>
                <input type="text" value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} required
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-1.5">
                  <BookIcon size={14} /> Course
                </label>
                <input type="text" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-1.5">
                  <CalendarIcon size={14} /> Year Level
                </label>
                <input type="text" value={formData.year_level} onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-1.5">
                  <PhoneIcon size={14} /> Contact Number
                </label>
                <input type="text" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-1.5">
                <MailIcon size={14} /> Email
              </label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
                className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary transition" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-primary text-white border-none rounded-lg text-[14px] font-medium cursor-pointer mt-6 hover:bg-primary-hover transition disabled:opacity-50">
              {saving ? "Saving..." : "Update Profile"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
