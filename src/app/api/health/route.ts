import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Keep-alive / health probe. Its real purpose is to generate genuine database
// activity so a Supabase Free project is not paused for 7 days of inactivity
// when the clinic is idle (weekends, semester breaks). Invoked by Vercel Cron
// via vercel.json.
//
// Safety: unauthenticated, but performs only four indexed head-counts, accepts
// no input, and returns zero record data — just per-table reachability flags.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();

  // Tables this system genuinely uses. head+exact count is the cheapest possible
  // round trip; results are discarded, only reachability is reported.
  const tables = ["system_settings", "users", "accommodations", "appointments"];
  const db: Record<string, boolean> = Object.fromEntries(tables.map((t) => [t, false]));

  try {
    const supabase = createServiceClient();
    const results = await Promise.all(
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
    await Promise.allSettled(results);
  } catch (err) {
    console.warn(
      "[health] database unreachable:",
      (err as Error)?.message ?? err
    );
  }

  const reachable = Object.values(db).filter(Boolean).length;
  const ok = reachable === tables.length;

  return NextResponse.json(
    {
      status: ok ? "ok" : reachable > 0 ? "degraded" : "unreachable",
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
