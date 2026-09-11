import { createServiceClient } from "@/lib/supabase/service";

export type NotificationType = 
  | "appointment_approved"
  | "appointment_rejected"
  | "certificate_approved"
  | "certificate_rejected"
  | "new_appointment"
  | "new_certificate"
  | "new_user"
  | "system";

export async function createNotification(params: {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const supabase = createServiceClient();
    await supabase.from("notifications").insert({
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      is_read: false,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// Create notifications for all admins/nurses
export async function notifyAdmins(params: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const supabase = createServiceClient();
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .in("role", ["admin", "nurse"]);

    if (!admins || admins.length === 0) return;

    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      is_read: false,
    }));

    await supabase.from("notifications").insert(notifications);
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}
