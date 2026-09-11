/**
 * Log an activity to the activity_logs table via API.
 * Non-blocking — errors are silently ignored.
 */
export async function logActivity(action: string, targetType?: string, targetId?: string, details?: string) {
  try {
    await fetch("/api/activity-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, target_type: targetType, target_id: targetId, details }),
    });
  } catch {
    // Non-critical — don't block the UI
  }
}
