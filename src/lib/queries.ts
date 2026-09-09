import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/types/database";

export async function getDashboardStats(
  userId: string,
  role: string
): Promise<DashboardStats> {
  const supabase = await createClient();
  const isAdminOrNurse = role === "admin" || role === "nurse";

  let appointmentsQuery = supabase.from("appointments").select("id, status", {
    count: "exact",
    head: false,
  });
  let certificatesQuery = supabase.from("certificates").select("id, status", {
    count: "exact",
    head: false,
  });

  if (!isAdminOrNurse) {
    appointmentsQuery = appointmentsQuery.eq("user_id", userId);
    certificatesQuery = certificatesQuery.eq("user_id", userId);
  }

  const [{ count: totalAppointments }, { count: totalCertificates }] =
    await Promise.all([appointmentsQuery, certificatesQuery]);

  let pendingApptQuery = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pending");
  let pendingCertQuery = supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pending");

  if (!isAdminOrNurse) {
    pendingApptQuery = pendingApptQuery.eq("user_id", userId);
    pendingCertQuery = pendingCertQuery.eq("user_id", userId);
  }

  const [{ count: pendingAppointments }, { count: pendingCertificates }] =
    await Promise.all([pendingApptQuery, pendingCertQuery]);

  return {
    totalAppointments: totalAppointments ?? 0,
    totalCertificates: totalCertificates ?? 0,
    pendingAppointments: pendingAppointments ?? 0,
    pendingCertificates: pendingCertificates ?? 0,
  };
}

export async function getRecentActivity(userId: string, role: string) {
  const supabase = await createClient();
  const isAdminOrNurse = role === "admin" || role === "nurse";

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

  const [{ data: appointments }, { data: certificates }] = await Promise.all([
    appointmentsQ,
    certificatesQ,
  ]);

  const merged: Array<{
    id: string;
    date: string;
    status: string;
    created_at: string;
    type: string;
  }> = [
    ...(appointments || []).map(
      (a: Record<string, unknown>) =>
        ({
          id: a.id as string,
          date: a.appointment_date as string,
          status: a.status as string,
          created_at: a.created_at as string,
          type: "Appointment",
        })
    ),
    ...(certificates || []).map(
      (c: Record<string, unknown>) =>
        ({
          id: c.id as string,
          date: c.date_needed as string,
          status: c.status as string,
          created_at: c.created_at as string,
          type: "Certificate",
        })
    ),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return merged.slice(0, 5);
}
