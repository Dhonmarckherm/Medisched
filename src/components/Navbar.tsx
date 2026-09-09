"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HospitalIcon, MenuIcon, XIcon } from "@/components/Icons";

interface NavbarProps {
  user?: {
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const isAdminOrNurse = user?.role === "admin" || user?.role === "nurse";
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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

        {/* Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile" className="nav-link text-[14px]">
                Profile
              </Link>
              <button
                onClick={handleLogout}
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
                    <Link href="/pending" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Pending</Link>
                    <Link href="/admin" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Admin</Link>
                  </>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="mt-2 py-2.5 bg-primary text-white rounded-lg font-medium border-none cursor-pointer text-[14px]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link href="/signup" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </nav>
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
