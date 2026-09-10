import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import AppointmentsListClient from "@/components/AppointmentsListClient";

export default async function AppointmentsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dbUser } = await supabase.from("users").select("*").eq("auth_id", user.id).single();
  if (!dbUser) redirect("/login");

  const isAdminOrNurse = dbUser.role === "admin" || dbUser.role === "nurse";

  let query = supabase.from("appointments").select("*, users(email)").order("created_at", { ascending: false });
  if (!isAdminOrNurse) query = query.eq("user_id", dbUser.id);

  const { data: appointments } = await query;

  return (
    <div className="min-h-screen" style={{ background: "#f5f8fb" }}>
      <Navbar user={dbUser} />
      <main className="pt-[100px] pb-10 w-[90%] max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[30px] font-bold text-[#222]">Appointments</h1>
          {!isAdminOrNurse && (
            <Link href="/appointments/new" className="bg-primary text-white rounded-lg px-4 py-1.5 text-[13px] font-medium no-underline hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg transition">
              + New Request
            </Link>
          )}
        </div>

        <AppointmentsListClient appointments={appointments || []} isAdminOrNurse={isAdminOrNurse} />
      </main>
    </div>
  );
}
