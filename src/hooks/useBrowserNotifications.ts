"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface BrowserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

export function useBrowserNotifications(enabled: boolean) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const lastNotifiedRef = useRef<Set<string>>(new Set());

  // Check current permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission from the browser
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return "unsupported" as const;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return "denied" as const;
    }
  }, []);

  // Show a browser notification
  const showBrowserNotification = useCallback((notification: BrowserNotification) => {
    // Don't show if permission not granted
    if (permission !== "granted") return;

    // Don't show duplicate notifications
    if (lastNotifiedRef.current.has(notification.id)) return;
    lastNotifiedRef.current.add(notification.id);

    // Keep only last 50 IDs to prevent memory leak
    if (lastNotifiedRef.current.size > 50) {
      const first = lastNotifiedRef.current.values().next().value;
      if (first) lastNotifiedRef.current.delete(first);
    }

    // Choose icon based on notification type
    const iconMap: Record<string, string> = {
      appointment_status: "/icons/calendar.svg",
      certificate_status: "/icons/certificate.svg",
      new_request: "/icons/chart.svg",
      new_user: "/icons/users.svg",
      system: "/icons/logo.svg",
    };

    const icon = iconMap[notification.type] || "/icons/logo.svg";

    // Show the notification
    const notif = new Notification(notification.title, {
      body: notification.message,
      icon,
      badge: "/icons/logo.svg",
      tag: notification.id, // Prevents duplicate notifications
      requireInteraction: false,
    });

    // Click notification → open the app
    notif.onclick = () => {
      window.focus();
      if (notification.type === "new_request" || notification.type === "new_user") {
        window.location.href = "/";
      } else {
        window.location.href = "/dashboard";
      }
      notif.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => notif.close(), 5000);
  }, [permission]);

  // Check for new notifications and show browser popups
  const checkAndNotify = useCallback(async (userId: string | null, userRole: string | null) => {
    if (!enabled || permission !== "granted") return;

    try {
      const url = userRole === "student" || userRole === "staff"
        ? `/api/notifications?unreadOnly=true`
        : `/api/notifications?unreadOnly=true`;

      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      const notifications: BrowserNotification[] = data.notifications || [];

      // Show browser notification for each new one
      for (const notif of notifications) {
        showBrowserNotification(notif);
      }
    } catch {
      // Silently fail
    }
  }, [enabled, permission, showBrowserNotification]);

  return {
    permission,
    isSupported: typeof window !== "undefined" && "Notification" in window,
    requestPermission,
    checkAndNotify,
  };
}
