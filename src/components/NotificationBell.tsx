"use client";

import { useState, useEffect, useRef } from "react";
import { BellIcon, CalendarIcon, CertificateIcon, UsersIcon } from "@/components/Icons";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (ids: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment_approved":
      case "appointment_rejected":
      case "new_appointment":
        return <CalendarIcon size={14} className="text-blue-500" />;
      case "certificate_approved":
      case "certificate_rejected":
      case "new_certificate":
        return <CertificateIcon size={14} className="text-purple-500" />;
      case "new_user":
        return <UsersIcon size={14} className="text-green-500" />;
      default:
        return <BellIcon size={14} className="text-gray-500" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAsRead(notifications.filter((n) => !n.is_read).map((n) => n.id));
          }
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-100 hover:bg-gray-50 transition cursor-pointer"
      >
        <BellIcon size={18} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[360px] bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-[#111] m-0">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-50 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-[11px] text-primary font-medium bg-transparent border-none cursor-pointer hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <BellIcon size={20} className="text-gray-300" />
                </div>
                <p className="text-[13px] text-gray-400 m-0">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link || "#"}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 transition no-underline border-b border-gray-50/50 last:border-0 ${
                    !notif.is_read ? "bg-primary/[0.02]" : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    !notif.is_read ? "bg-primary/10" : "bg-gray-50"
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] m-0 leading-snug ${
                      !notif.is_read ? "font-semibold text-[#111]" : "font-normal text-gray-600"
                    }`}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-gray-400 m-0 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-300 m-0 mt-1">
                      {getTimeAgo(notif.created_at)}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/30">
              <Link
                href="/notifications"
                className="text-[12px] text-primary font-medium no-underline hover:underline flex items-center justify-center gap-1"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
