"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { HospitalIcon, MenuIcon, XIcon, BellIcon } from "@/components/Icons";

interface NavbarProps {
  user?: {
    first_name: string;
    last_name: string;
    role: string;
    id?: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const isAdminOrNurse = user?.role === "admin" || user?.role === "nurse";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [logoutModal, setLogoutModal] = useState(false);

  // Fetch notification counts based on user role
  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      if (isAdminOrNurse) {
        // Admin/Nurse: count pending items needing approval
        const [appts, certs] = await Promise.all([
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "Pending"),
          supabase.from("certificates").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        ]);
        setPendingCount((appts.count || 0) + (certs.count || 0));
      } else if (user) {
        // Student: count their items with status updates (Approved, Rejected, Completed)
        const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
        if (userData) {
          const [appts, certs] = await Promise.all([
            supabase.from("appointments").select("id", { count: "exact", head: true })
              .eq("user_id", userData.id)
              .in("status", ["Approved", "Rejected", "Completed"]),
            supabase.from("certificates").select("id", { count: "exact", head: true })
              .eq("user_id", userData.id)
              .in("status", ["Approved", "Rejected", "Completed"]),
          ]);
          setPendingCount((appts.count || 0) + (certs.count || 0));
        }
      }
    }

    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, isAdminOrNurse, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLogoutModal(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-white h-[72px] flex items-center border-b border-gray-100">
      <div className="w-[90%] max-w-[1200px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <HospitalIcon className="text-white" size={20} />
          </div>
          <h2 className="text-[20px] font-bold text-[#1a1a2e] m-0 tracking-tight">
            MEDI<span className="text-primary">SCHED</span>
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block">
          <ul className="flex list-none gap-8 items-center m-0 p-0">
            <li><Link href="/" className="nav-link">Home</Link></li>
            {user ? (
              <>
                <li><Link href="/dashboard" className="nav-link">Dashboard</Link></li>
                <li><Link href="/appointments" className="nav-link">Appointments</Link></li>
                <li><Link href="/certificates" className="nav-link">Certificates</Link></li>
                <li><Link href="/schedule" className="nav-link">Schedule</Link></li>
                {isAdminOrNurse && (
                  <>
                    <li><Link href="/pending" className="nav-link">Pending</Link></li>
                    <li><Link href="/admin" className="nav-link">Admin</Link></li>
                  </>
                )}
              </>
            ) : (
              <>
                <li><Link href="/appointments" className="nav-link">Appointments</Link></li>
                <li><Link href="/certificates" className="nav-link">Certificates</Link></li>
              </>
            )}
          </ul>
        </nav>

        {/* Auth Buttons + Notifications */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition"
                >
                  <BellIcon size={20} />
                  {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-[998]" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-[calc(100% + 8px)] w-[320px] bg-white rounded-xl border border-gray-100 shadow-lg z-[999] overflow-hidden">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="text-[15px] font-semibold text-[#1a1a2e] m-0">Notifications</h3>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {isAdminOrNurse ? "Pending items requiring attention" : "Updates on your requests"}
                        </p>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {pendingCount === 0 ? (
                          <div className="p-6 text-center text-gray-400 text-[14px]">
                            {isAdminOrNurse ? "No pending items" : "No new updates"}
                          </div>
                        ) : isAdminOrNurse ? (
                          <>
                            <PendingNotifItem
                              supabase={supabase}
                              table="appointments"
                              label="Pending Appointments"
                              href="/pending"
                              onClick={() => setNotifOpen(false)}
                            />
                            <PendingNotifItem
                              supabase={supabase}
                              table="certificates"
                              label="Pending Certificates"
                              href="/pending"
                              onClick={() => setNotifOpen(false)}
                            />
                          </>
                        ) : (
                          <>
                            <PendingNotifItem
                              supabase={supabase}
                              table="appointments"
                              label="Appointment Updates"
                              href="/appointments"
                              onClick={() => setNotifOpen(false)}
                              statusFilter={["Approved", "Rejected", "Completed"]}
                            />
                            <PendingNotifItem
                              supabase={supabase}
                              table="certificates"
                              label="Certificate Updates"
                              href="/certificates"
                              onClick={() => setNotifOpen(false)}
                              statusFilter={["Approved", "Rejected", "Completed"]}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Link href="/profile" className="nav-link text-[14px]">
                Profile
              </Link>
              <button
                onClick={() => setLogoutModal(true)}
                className="text-[14px] text-gray-500 hover:text-red-500 font-medium bg-transparent border-none cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[14px] text-gray-600 hover:text-primary font-medium no-underline px-4 py-2 rounded-lg hover:bg-gray-50">
                Login
              </Link>
              <Link href="/signup" className="text-[14px] bg-primary text-white font-medium no-underline px-5 py-2.5 rounded-lg hover:bg-primary-hover">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-gray-600 bg-transparent border-none cursor-pointer p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-[72px] left-0 right-0 bg-white border-b border-gray-100 lg:hidden z-[999]">
          <nav className="flex flex-col p-4 gap-1">
            <Link href="/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Home</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link href="/appointments" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Appointments</Link>
                <Link href="/certificates" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Certificates</Link>
                <Link href="/schedule" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Schedule</Link>
                <Link href="/profile" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Profile</Link>
                {isAdminOrNurse && (
                  <>
                    <Link href="/pending" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                      Pending {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingCount}</span>}
                    </Link>
                    <Link href="/admin" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Admin</Link>
                  </>
                )}
                <button
                  onClick={() => { setLogoutModal(true); setMobileOpen(false); }}
                  className="mt-2 py-2.5 bg-primary text-white rounded-lg font-medium border-none cursor-pointer text-[14px]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/appointments" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Appointments</Link>
                <Link href="/certificates" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Certificates</Link>
                <Link href="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link href="/signup" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setLogoutModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-[90%] max-w-[380px] shadow-xl animate-scale-in">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XIcon className="text-red-500" size={28} />
              </div>
              <h3 className="text-[18px] font-bold text-[#1a1a2e] mb-2">Confirm Logout</h3>
              <p className="text-[14px] text-gray-400 mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setLogoutModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-[14px] font-medium text-gray-600 bg-white cursor-pointer hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[14px] font-medium border-none cursor-pointer hover:bg-red-600 transition"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .nav-link {
          text-decoration: none;
          color: #6b7280;
          font-weight: 500;
          font-size: 14px;
          transition: 0.2s;
        }
        .nav-link:hover {
          color: #2e8b57;
        }
        .mobile-nav-link {
          text-decoration: none;
          color: #374151;
          font-weight: 500;
          font-size: 14px;
          padding: 10px 12px;
          border-radius: 8px;
          transition: 0.2s;
        }
        .mobile-nav-link:hover {
          background: #f3f4f6;
          color: #2e8b57;
        }
      `}</style>
    </header>
  );
}

// Sub-component for each notification item
function PendingNotifItem({ supabase, table, label, href, onClick, statusFilter }: {
  supabase: any;
  table: string;
  label: string;
  href: string;
  onClick: () => void;
  statusFilter?: string[];
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    if (statusFilter) {
      query = query.in("status", statusFilter);
    } else {
      query = query.eq("status", "Pending");
    }
    query.then(({ count }: { count: number | null }) => setCount(count || 0));
  }, [supabase, table, statusFilter]);

  if (count === 0) return null;

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between p-4 hover:bg-gray-50 no-underline border-b border-gray-50 last:border-0 transition"
    >
      <div>
        <p className="text-[14px] font-medium text-gray-700 m-0">{label}</p>
        <p className="text-[12px] text-gray-400 mt-0.5 m-0">Needs review</p>
      </div>
      <span className="w-[24px] h-[24px] bg-amber-100 text-amber-700 text-[12px] font-bold rounded-full flex items-center justify-center">
        {count}
      </span>
    </Link>
  );
}
