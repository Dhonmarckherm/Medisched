import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Keep-alive / health probe. Its real purpose is to generate genuine database
// activity so a Supabase Free project is not paused for 7 days of inactivity
// when the clinic is idle (weekends, semester breaks). Invoked by Vercel Cron
// via vercel.json.
//
// Safety: unauthenticated, but performs only indexed head-counts, accepts no
// input, and returns zero record data — just per-table reachability flags.
// Because a Hobby cron can only fire once per day, this single hit intentionally
// touches every core table to generate meaningful daily database activity.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();

  // Tables this system genuinely uses. head+exact count is the cheapest possible
  // round trip; results are discarded, only reachability is reported.
  const tables = [
    "system_settings",
    "users",
    "accommodations",
    "appointments",
    "notifications",
    "activity_logs",
    "login_logs",
    "rate_limits",
  ];
  const db: Record<string, boolean> = Object.fromEntries(tables.map((t) => [t, false]));

  try {
    const supabase = createServiceClient();
    await Promise.allSettled(
      tables.map((table) =>
        supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .limit(1)
          .then(({ error }) => {
            db[table] = !error;
          })
      )
    );
  } catch (err) {
    console.warn(
      "[health] database unreachable:",
      (err as Error)?.message ?? err
    );
  }

  const reachable = Object.values(db).filter(Boolean).length;
  // Core tables define health; optional log/audit tables may legitimately be absent.
  const coreOk = db["system_settings"] && db["users"] && db["accommodations"] && db["appointments"];
  const status = coreOk ? "ok" : reachable > 0 ? "degraded" : "unreachable";

  return NextResponse.json(
    {
      status,
      service: "medisched-cert",
      db,
      reachable,
      total: tables.length,
      durationMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
