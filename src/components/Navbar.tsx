"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { HospitalIcon, MenuIcon, XIcon, BellIcon, CalendarIcon, CertificateIcon, ClockIcon, UserIcon, ShieldIcon, HomeIcon, DashboardIcon } from "@/components/Icons";

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
  const pathname = usePathname();
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
            MEDISCHED <span className="text-primary">CERT</span>
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
                                <li><Link href="/calendar" className="nav-link">Calendar</Link></li>
                {isAdminOrNurse && (
                  <>
                    <li><Link href="/pending" className="nav-link">Pending</Link></li>
                    <li><Link href="/admin" className="nav-link">Admin</Link></li>
                    <li><Link href="/admin/analytics" className="nav-link">Analytics</Link></li>
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
          className="lg:hidden relative z-[1001] text-gray-600 bg-transparent border-none cursor-pointer p-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          {mobileOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Menu - Side Drawer */}
      {mobileOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[999] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">
            
            {/* Profile Header */}
            {user ? (
              <div className="px-5 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-gray-800 truncate">{user.first_name} {user.last_name}</div>
                    <div className="text-[12px] text-gray-400 capitalize">{user.role}</div>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1">
                    <XIcon size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <HospitalIcon className="text-white" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-bold text-gray-800">MEDISCHED <span className="text-primary">CERT</span></div>
                    <div className="text-[11px] text-gray-400">Medical Clinic Portal</div>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1">
                    <XIcon size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
              {/* Main */}
              <SidebarLink href="/" icon={<HomeIcon size={20} />} label="Home" pathname={pathname} onClick={() => setMobileOpen(false)} />
              
              {user ? (
                <>
                  <SidebarLink href="/dashboard" icon={<DashboardIcon size={20} />} label="Dashboard" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/appointments" icon={<CalendarIcon size={20} />} label="Appointments" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/certificates" icon={<CertificateIcon size={20} />} label="Certificates" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/schedule" icon={<ClockIcon size={20} />} label="Schedule" pathname={pathname} onClick={() => setMobileOpen(false)} />
                                    <SidebarLink href="/calendar" icon={<CalendarIcon size={20} />} label="Calendar" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/profile" icon={<UserIcon size={20} />} label="Profile" pathname={pathname} onClick={() => setMobileOpen(false)} />

                  {isAdminOrNurse && (
                    <>
                      <div className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Admin</div>
                      <SidebarLink href="/pending" icon={<BellIcon size={20} />} label="Pending" pathname={pathname} onClick={() => setMobileOpen(false)} badge={pendingCount} />
                      <SidebarLink href="/admin" icon={<ShieldIcon size={20} />} label="Admin Dashboard" pathname={pathname} onClick={() => setMobileOpen(false)} />
                      <SidebarLink href="/admin/analytics" icon={<DashboardIcon size={20} />} label="Analytics" pathname={pathname} onClick={() => setMobileOpen(false)} />
                    </>
                  )}
                </>
              ) : (
                <>
                  <SidebarLink href="/appointments" icon={<CalendarIcon size={20} />} label="Appointments" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/certificates" icon={<CertificateIcon size={20} />} label="Certificates" pathname={pathname} onClick={() => setMobileOpen(false)} />
                </>
              )}
            </nav>

            {/* Bottom section */}
            <div className="px-3 pb-5 border-t border-gray-100 pt-4">
              {user ? (
                <button
                  onClick={() => { setLogoutModal(true); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 rounded-xl border-none bg-transparent cursor-pointer text-[14px] font-medium hover:bg-red-50 transition"
                >
                  <XIcon size={20} /> Logout
                </button>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-[14px] no-underline hover:border-primary hover:text-primary transition">
                    Login
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 bg-primary text-white rounded-xl font-semibold text-[14px] no-underline hover:bg-primary-hover transition">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
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
          border-radius: 10px;
          transition: 0.2s;
          display: block;
        }
        .mobile-nav-link:hover {
          background: #f0f7f2;
          color: #2e8b57;
        }
        .mobile-nav-link:active {
          background: #e0efe4;
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

// Sidebar link component for mobile drawer
function SidebarLink({ href, icon, label, pathname, onClick, badge }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
  onClick: () => void;
  badge?: number;
}) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline text-[14px] font-medium transition-all duration-150 ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      <span className={isActive ? "text-primary" : "text-gray-400"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{badge}</span>
      )}
    </Link>
  );
}
