"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { HospitalIcon, MenuIcon, XIcon, BellIcon, CalendarIcon, CertificateIcon, ClockIcon, UserIcon, ShieldIcon, HomeIcon, DashboardIcon, ChevronDownIcon } from "@/components/Icons";

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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [logoutModal, setLogoutModal] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    if (avatarOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [avatarOpen]);

  // Fetch notification counts + realtime subscription
  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      if (isAdminOrNurse) {
        const [appts, certs] = await Promise.all([
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "Pending"),
          supabase.from("certificates").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        ]);
        setPendingCount((appts.count || 0) + (certs.count || 0));
      } else if (user) {
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

    // Subscribe to realtime changes for instant updates
    const channel = supabase
      .channel("navbar-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => fetchNotifications())
      .on("postgres_changes", { event: "*", schema: "public", table: "certificates" }, () => fetchNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isAdminOrNurse, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLogoutModal(false);
    setAvatarOpen(false);
    router.push("/");
    router.refresh();
  };

  const initials = user ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}` : "";

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-[1200] h-[64px] flex items-center bg-white/80 backdrop-blur-xl" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="w-[90%] max-w-[1200px] mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <HospitalIcon className="text-white" size={18} />
          </div>
          <span className="text-[17px] font-bold text-[#1a1a2e] tracking-[-0.3px]">
            MEDISCHED <span className="text-primary">CERT</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block">
          <ul className="flex list-none gap-1 items-center m-0 p-0">
            {!user && <li><NavLink href="/" pathname={pathname}>Home</NavLink></li>}
            {user ? (
              <>
                <li><NavLink href="/dashboard" pathname={pathname}>Dashboard</NavLink></li>
                <li><NavLink href="/appointments" pathname={pathname}>Appointments</NavLink></li>
                <li><NavLink href="/certificates" pathname={pathname}>Certificates</NavLink></li>
                <li><NavLink href="/calendar" pathname={pathname}>Calendar</NavLink></li>
                {isAdminOrNurse && (
                  <>
                    <li><NavLink href="/pending" pathname={pathname}>Pending</NavLink></li>
                    <li><NavLink href="/admin/analytics" pathname={pathname}>Analytics</NavLink></li>
                  </>
                )}
              </>
            ) : (
              <>
                <li><NavLink href="/appointments" pathname={pathname}>Appointments</NavLink></li>
                <li><NavLink href="/certificates" pathname={pathname}>Certificates</NavLink></li>
              </>
            )}
          </ul>
        </nav>

        {/* Right Section */}
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-black/[0.04] text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <BellIcon size={19} />
                  {pendingCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-[998]" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-[calc(100% + 8px)] w-[340px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-[999] overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                      {/* Header */}
                      <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <div>
                          <h3 className="text-[14px] font-semibold text-[#111] m-0 leading-tight">Notifications</h3>
                          <p className="text-[12px] text-gray-400 mt-0.5 mb-0 font-normal">
                            {isAdminOrNurse ? "Items needing your review" : "Updates on your requests"}
                          </p>
                        </div>
                        {pendingCount > 0 && (
                          <span className="bg-red-50 text-red-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            {pendingCount}
                          </span>
                        )}
                      </div>
                      {/* Body */}
                      <div className="max-h-[300px] overflow-y-auto">
                        {pendingCount === 0 ? (
                          <div className="py-10 flex flex-col items-center">
                            <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center mb-2.5">
                              <BellIcon size={20} className="text-gray-300" />
                            </div>
                            <p className="text-[13px] font-medium text-gray-500 m-0">
                              {isAdminOrNurse ? "All caught up" : "No new updates"}
                            </p>
                            <p className="text-[12px] text-gray-300 mt-0.5 m-0">
                              {isAdminOrNurse ? "Nothing pending right now" : "We'll notify you here"}
                            </p>
                          </div>
                        ) : isAdminOrNurse ? (
                          <>
                            <PendingNotifItem supabase={supabase} table="appointments" label="Pending Appointments" description="Awaiting your decision" icon={<CalendarIcon size={16} />} iconBg="bg-blue-50" iconColor="text-blue-500" href="/pending" onClick={() => setNotifOpen(false)} />
                            <PendingNotifItem supabase={supabase} table="certificates" label="Pending Certificates" description="Ready for review" icon={<CertificateIcon size={16} />} iconBg="bg-purple-50" iconColor="text-purple-500" href="/pending" onClick={() => setNotifOpen(false)} />
                          </>
                        ) : (
                          <>
                            <PendingNotifItem supabase={supabase} table="appointments" label="Appointment Updates" description="Status changed" icon={<CalendarIcon size={16} />} iconBg="bg-blue-50" iconColor="text-blue-500" href="/appointments" onClick={() => setNotifOpen(false)} statusFilter={["Approved", "Rejected", "Completed"]} />
                            <PendingNotifItem supabase={supabase} table="certificates" label="Certificate Updates" description="Status changed" icon={<CertificateIcon size={16} />} iconBg="bg-purple-50" iconColor="text-purple-500" href="/certificates" onClick={() => setNotifOpen(false)} statusFilter={["Approved", "Rejected", "Completed"]} />
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Avatar + Dropdown */}
              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="flex items-center gap-2 bg-transparent border-none cursor-pointer pl-1 pr-2 py-1 rounded-lg hover:bg-black/[0.04] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[12px] font-semibold">
                    {initials}
                  </div>
                  <ChevronDownIcon size={14} className={`text-gray-400 transition-transform duration-200 ${avatarOpen ? "rotate-180" : ""}`} />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 top-[calc(100% + 6px)] w-[200px] bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] z-[999] overflow-hidden py-1" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <p className="text-[13px] font-semibold text-gray-800 m-0">{user.first_name} {user.last_name}</p>
                      <p className="text-[11px] text-gray-400 m-0 capitalize">{user.role}</p>
                    </div>
                    <Link href="/profile" onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-black/[0.03] no-underline transition-colors">
                      <UserIcon size={15} className="text-gray-400" /> Profile
                    </Link>
                    <button
                      onClick={() => setLogoutModal(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 bg-transparent border-none cursor-pointer transition-colors text-left"
                    >
                      <XIcon size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13px] text-gray-600 hover:text-gray-900 font-medium no-underline px-3 py-2 rounded-lg hover:bg-black/[0.03] transition-colors">
                Login
              </Link>
              <Link href="/signup" className="text-[13px] bg-primary text-white font-medium no-underline px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Notification Bell + Menu Button */}
        <div className="flex lg:hidden items-center gap-1">
          {user && (
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); }}
                className={`relative bg-transparent border-none cursor-pointer p-2.5 rounded-lg transition-colors ${
                  notifOpen ? "bg-gray-100 text-gray-900" : "hover:bg-black/[0.04] active:bg-black/[0.08] text-gray-600"
                }`}
                style={{ minWidth: 44, minHeight: 44 }}
              >
                {notifOpen ? <XIcon size={24} className="text-gray-900" /> : <BellIcon size={22} />}
                {!notifOpen && pendingCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </button>
            </div>
          )}
          <button
            className={`lg:hidden bg-transparent border-none cursor-pointer p-2.5 rounded-lg transition-colors ${
              mobileOpen ? "bg-gray-100 text-gray-900" : "hover:bg-black/[0.04] active:bg-black/[0.08] text-gray-600"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {mobileOpen ? <XIcon size={24} className="text-gray-900" /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>
    </header>

      {/* Mobile Notification Popup */}
      {mounted && notifOpen && (
        <div suppressHydrationWarning className="fixed top-0 left-0 right-0 bottom-0 z-[1100] lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setNotifOpen(false)} />
          <div className="absolute top-[68px] left-2 right-2 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div>
                <h3 className="text-[14px] font-semibold text-[#111] m-0 leading-tight">Notifications</h3>
                <p className="text-[12px] text-gray-400 mt-0.5 mb-0">
                  {isAdminOrNurse ? "Items needing your review" : "Updates on your requests"}
                </p>
              </div>
              {pendingCount > 0 && (
                <span className="bg-red-50 text-red-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto">
              {pendingCount === 0 ? (
                <div className="py-10 flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center mb-2.5">
                    <BellIcon size={20} className="text-gray-300" />
                  </div>
                  <p className="text-[13px] font-medium text-gray-500 m-0">
                    {isAdminOrNurse ? "All caught up" : "No new updates"}
                  </p>
                  <p className="text-[12px] text-gray-300 mt-0.5 m-0">
                    {isAdminOrNurse ? "Nothing pending right now" : "We'll notify you here"}
                  </p>
                </div>
              ) : isAdminOrNurse ? (
                <>
                  <PendingNotifItem supabase={supabase} table="appointments" label="Pending Appointments" description="Awaiting your decision" icon={<CalendarIcon size={16} />} iconBg="bg-blue-50" iconColor="text-blue-500" href="/pending" onClick={() => setNotifOpen(false)} />
                  <PendingNotifItem supabase={supabase} table="certificates" label="Pending Certificates" description="Ready for review" icon={<CertificateIcon size={16} />} iconBg="bg-purple-50" iconColor="text-purple-500" href="/pending" onClick={() => setNotifOpen(false)} />
                </>
              ) : (
                <>
                  <PendingNotifItem supabase={supabase} table="appointments" label="Appointment Updates" description="Status changed" icon={<CalendarIcon size={16} />} iconBg="bg-blue-50" iconColor="text-blue-500" href="/appointments" onClick={() => setNotifOpen(false)} statusFilter={["Approved", "Rejected", "Completed"]} />
                  <PendingNotifItem supabase={supabase} table="certificates" label="Certificate Updates" description="Status changed" icon={<CertificateIcon size={16} />} iconBg="bg-purple-50" iconColor="text-purple-500" href="/certificates" onClick={() => setNotifOpen(false)} statusFilter={["Approved", "Rejected", "Completed"]} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Side Drawer */}
      {mounted && mobileOpen && (
        <div suppressHydrationWarning className="fixed top-0 left-0 right-0 bottom-0 z-[1300] lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">

            {/* Header */}
            {user ? (
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-[13px] flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-gray-800 truncate">{user.first_name} {user.last_name}</div>
                    <div className="text-[11px] text-gray-400 capitalize">{user.role}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <HospitalIcon className="text-white" size={18} />
                  </div>
                  <span className="text-[16px] font-bold text-gray-800">MEDISCHED <span className="text-primary">CERT</span></span>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
              {/* Mobile Notification Summary */}
              {user && pendingCount > 0 && (
                <div className="mx-1 mb-2 px-3 py-2.5 bg-amber-50 rounded-lg flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <BellIcon size={15} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-amber-800 m-0">{pendingCount} pending</p>
                    <p className="text-[11px] text-amber-500 m-0">Needs your attention</p>
                  </div>
                </div>
              )}
              {!user && (
                <SidebarLink href="/" icon={<HomeIcon size={19} />} label="Home" pathname={pathname} onClick={() => setMobileOpen(false)} />
              )}
              {user ? (
                <>
                  <SidebarLink href="/dashboard" icon={<DashboardIcon size={19} />} label="Dashboard" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/appointments" icon={<CalendarIcon size={19} />} label="Appointments" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/certificates" icon={<CertificateIcon size={19} />} label="Certificates" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/calendar" icon={<ClockIcon size={19} />} label="Calendar" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/profile" icon={<UserIcon size={19} />} label="Profile" pathname={pathname} onClick={() => setMobileOpen(false)} />

                  {isAdminOrNurse && (
                    <>
                      <div className="px-3 pt-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Admin</div>
                      <SidebarLink href="/pending" icon={<BellIcon size={19} />} label="Pending" pathname={pathname} onClick={() => setMobileOpen(false)} badge={pendingCount} />
                      <SidebarLink href="/admin/analytics" icon={<ShieldIcon size={19} />} label="Analytics" pathname={pathname} onClick={() => setMobileOpen(false)} />
                    </>
                  )}
                </>
              ) : (
                <>
                  <SidebarLink href="/appointments" icon={<CalendarIcon size={19} />} label="Appointments" pathname={pathname} onClick={() => setMobileOpen(false)} />
                  <SidebarLink href="/certificates" icon={<CertificateIcon size={19} />} label="Certificates" pathname={pathname} onClick={() => setMobileOpen(false)} />
                </>
              )}
            </nav>

            {/* Bottom */}
            <div className="px-3 pb-4 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {user ? (
                <button
                  onClick={() => { setLogoutModal(true); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 rounded-lg border-none bg-transparent cursor-pointer text-[13px] font-medium hover:bg-red-50 transition-colors"
                >
                  <XIcon size={18} /> Logout
                </button>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium text-[13px] no-underline hover:border-primary hover:text-primary transition-colors">
                    Login
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 bg-primary text-white rounded-lg font-medium text-[13px] no-underline hover:bg-primary-hover transition-colors">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {mounted && logoutModal && (
        <div suppressHydrationWarning className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setLogoutModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-[90%] max-w-[360px] shadow-xl animate-scale-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XIcon className="text-red-500" size={24} />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1a1a2e] mb-1.5">Sign out?</h3>
              <p className="text-[13px] text-gray-400 mb-5">You'll need to sign in again to access your account.</p>
              <div className="flex gap-2.5">
                <button onClick={() => setLogoutModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleLogout}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[13px] font-medium border-none cursor-pointer hover:bg-red-600 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Nav Link (desktop) ── */
function NavLink({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const isActive = pathname === href;
  return (
    <li>
      <Link href={href} className={`no-underline text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 ${
        isActive ? "text-primary bg-primary/[0.07]" : "text-gray-500 hover:text-gray-800 hover:bg-black/[0.03]"
      }`}>
        {children}
      </Link>
    </li>
  );
}

/* ── Notification item ── */
function PendingNotifItem({ supabase, table, label, description, icon, iconBg, iconColor, href, onClick, statusFilter }: {
  supabase: any; table: string; label: string; description: string; icon: React.ReactNode; iconBg: string; iconColor: string; href: string; onClick: () => void; statusFilter?: string[];
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
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 no-underline transition-colors group" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <div className={`w-9 h-9 rounded-[10px] ${iconBg} flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#111] m-0 leading-tight">{label}</p>
        <p className="text-[12px] text-gray-400 mt-0.5 m-0 leading-tight">{description}</p>
      </div>
      <span className="min-w-[22px] h-[22px] bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
        {count}
      </span>
    </Link>
  );
}

/* ── Sidebar link (mobile) ── */
function SidebarLink({ href, icon, label, pathname, onClick, badge }: {
  href: string; icon: React.ReactNode; label: string; pathname: string; onClick: () => void; badge?: number;
}) {
  const isActive = pathname === href;

  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg no-underline text-[13px] font-medium transition-colors duration-150 ${
        isActive ? "text-primary bg-primary/[0.07]" : "text-gray-500 hover:bg-black/[0.03] hover:text-gray-700"
      }`}>
      <span className={isActive ? "text-primary" : "text-gray-400"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{badge}</span>
      )}
    </Link>
  );
}
