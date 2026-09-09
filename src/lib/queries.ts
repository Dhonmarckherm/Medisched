import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/types/database";

// Optimized: Reduced from 4 queries to 2 by calculating pending in-memory
export async function getDashboardStats(
  userId: string,
  role: string
): Promise<DashboardStats> {
  const supabase = await createClient();
  const isAdminOrNurse = role === "admin" || role === "nurse";

  // Build queries with count
  let appointmentsQuery = supabase
    .from("appointments")
    .select("id, status", { count: "exact", head: false });
  
  let certificatesQuery = supabase
    .from("certificates")
    .select("id, status", { count: "exact", head: false });

  if (!isAdminOrNurse) {
    appointmentsQuery = appointmentsQuery.eq("user_id", userId);
    certificatesQuery = certificatesQuery.eq("user_id", userId);
  }

  // Run both queries in parallel
  const [appointmentsResult, certificatesResult] = await Promise.all([
    appointmentsQuery,
    certificatesQuery,
  ]);

  // Calculate pending counts from returned data
  const appointments = appointmentsResult.data || [];
  const certificates = certificatesResult.data || [];

  return {
    totalAppointments: appointmentsResult.count ?? 0,
    totalCertificates: certificatesResult.count ?? 0,
    pendingAppointments: appointments.filter((a: { status: string }) => a.status === "Pending").length,
    pendingCertificates: certificates.filter((c: { status: string }) => c.status === "Pending").length,
  };
}

// Optimized: Parallel queries with minimal fields
export async function getRecentActivity(userId: string, role: string) {
  const supabase = await createClient();
  const isAdminOrNurse = role === "admin" || role === "nurse";

  // Build queries
  let appointmentsQ = supabase
    .from("appointments")
    .select("id, appointment_date, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  let certificatesQ = supabase
    .from("certificates")
    .select("id, date_needed, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!isAdminOrNurse) {
    appointmentsQ = appointmentsQ.eq("user_id", userId);
    certificatesQ = certificatesQ.eq("user_id", userId);
  }

  // Fetch both in parallel
  const [{ data: appointments }, { data: certificates }] = await Promise.all([
    appointmentsQ,
    certificatesQ,
  ]);

  // Merge and sort in memory
  const merged = [
    ...(appointments || []).map((a: { id: string; appointment_date: string; status: string; created_at: string }) => ({
      id: a.id,
      date: a.appointment_date,
      status: a.status,
      created_at: a.created_at,
      type: "Appointment",
    })),
    ...(certificates || []).map((c: { id: string; date_needed: string; status: string; created_at: string }) => ({
      id: c.id,
      date: c.date_needed,
      status: c.status,
      created_at: c.created_at,
      type: "Certificate",
    })),
  ].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  return merged;
}
