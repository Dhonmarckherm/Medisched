"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

export default function NewCertificatePage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    purpose: "",
    date_needed: "",
    contact_number: "",
    email: "",
    remarks: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }
      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.id)
        .single();
      if (dbUser) {
        setUser(dbUser);
        setFormData((prev) => ({
          ...prev,
          contact_number: dbUser.contact_number || "",
          email: dbUser.email || "",
        }));
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    if (formData.date_needed < today) {
      setError("Date needed cannot be in the past");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create certificate request");
        setLoading(false);
        return;
      }

      setSuccess("Certificate request submitted successfully!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f8fb" }}>Loading...</div>;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={user} />
      <main className="pt-[100px] pb-10 flex justify-center">
        <div className="w-[900px] max-w-full bg-white border-[3px] border-primary rounded-[20px] overflow-hidden shadow-lg">
          {/* Form Header */}
          <div className="bg-primary text-white text-center py-6 px-5">
            <h2 className="text-[30px] font-bold m-0">Request Certificate</h2>
            <p className="mt-2 text-[14px] opacity-90">Fill in the details below to request a health certificate</p>
          </div>

          <div className="p-[35px]">
            {error && <div className="bg-[#f8d7da] text-[#842029] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#dc3545]">{error}</div>}
            {success && <div className="bg-[#d1e7dd] text-[#0f5132] p-4 rounded-[10px] mb-5 border-l-[5px] border-[#198754]">{success}</div>}

            {/* Auto-filled info */}
            <div className="bg-[#f4f8f5] rounded-[10px] p-5 mb-6">
              <h3 className="text-[14px] font-semibold text-[#555] mb-3">Student Information (Auto-filled)</h3>
              <div className="grid grid-cols-2 gap-3 text-[14px]">
                <div><span className="text-[#555]">Name:</span> <span className="font-semibold">{user.last_name}, {user.first_name}{user.middle_name ? ` ${user.middle_name}` : ""}</span></div>
                <div><span className="text-[#555]">ID Number:</span> <span className="font-semibold">{user.id_number}</span></div>
                <div><span className="text-[#555]">Course:</span> <span className="font-semibold">{user.course || "N/A"}</span></div>
                <div><span className="text-[#555]">Year Level:</span> <span className="font-semibold">{user.year_level || "N/A"}</span></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5">
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Purpose *</label>
                  <textarea value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} required rows={3}
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)] font-[Poppins] resize-none" placeholder="Describe the purpose of the certificate" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Date Needed *</label>
                  <input type="date" value={formData.date_needed} onChange={(e) => setFormData({ ...formData, date_needed: e.target.value })} required min={today}
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Contact Number</label>
                  <input type="text" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)]" />
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-[#333] text-[15px]">Remarks (Optional)</label>
                  <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows={2}
                    className="py-3.5 px-4 border border-[#dcdcdc] rounded-[10px] text-[15px] outline-none transition focus:border-primary focus:shadow-[0_0_10px_rgba(46,139,87,0.2)] font-[Poppins] resize-none" placeholder="Any additional remarks" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 bg-primary text-white border-none rounded-[10px] text-[16px] font-semibold cursor-pointer mt-5 hover:bg-primary-hover hover:-translate-y-0.5 transition disabled:opacity-50">
                {loading ? "Submitting..." : "Submit Certificate Request"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
