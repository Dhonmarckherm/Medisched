/**
 * Date helpers for MEDISCHED CERT.
 *
 * The clinic operates in the Philippines (Asia/Manila, UTC+8). Using
 * `new Date().toISOString()` returns a UTC date which is one day behind local
 * time between 00:00–07:59 PHT, wrongly rejecting valid same-day requests.
 * These helpers compute the calendar "today" in Manila time consistently.
 */

/** Returns the current date (Asia/Manila) as a YYYY-MM-DD string. */
export function getTodayISOManila(): string {
  return getISODateManila(new Date());
}

/** Converts a Date to its Asia/Manila calendar date as YYYY-MM-DD. */
export function getISODateManila(date: Date): string {
  // en-CA yields ISO-style YYYY-MM-DD; force the Manila timezone.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
