"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <header
      className="fixed top-0 left-0 right-0 z-[1000] bg-white h-[80px] flex items-center"
      style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
    >
      <div className="w-[90%] max-w-[1200px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span className="text-[34px] text-primary" style={{ lineHeight: 1 }}>🏥</span>
          <h2 className="text-[26px] font-bold text-[#222] m-0">
            MEDI<span className="text-primary">SCHED</span> CERT
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block">
          <ul className="flex list-none gap-[35px] items-center m-0 p-0">
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
                    <li><Link href="/admin" className="nav-link">Admin Panel</Link></li>
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

        {/* Auth Buttons / User Info */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/profile" className="nav-link">Profile</Link>
              <span className="text-[14px] text-[#555] font-medium">
                {user.first_name} {user.last_name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-white text-primary border-2 border-primary rounded-full px-7 py-3 font-semibold text-[15px] hover:bg-primary-hover hover:text-white hover:-translate-y-0.5 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-white text-primary border-2 border-primary rounded-full px-7 py-3 font-semibold text-[15px] no-underline hover:bg-primary-hover hover:text-white hover:-translate-y-0.5"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-white border-2 border-primary rounded-full px-8 py-3.5 font-semibold text-[15px] no-underline hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-[28px] text-primary bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-[80px] left-0 right-0 bg-white shadow-lg lg:hidden z-[999]">
          <nav className="flex flex-col p-5 gap-2">
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
                    <Link href="/admin" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Admin Panel</Link>
                  </>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="mt-2 py-3 bg-primary text-white rounded-full font-semibold border-none cursor-pointer"
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
          color: #333;
          font-weight: 500;
          font-size: 16px;
          transition: 0.3s;
        }
        .nav-link:hover {
          color: #2e8b57;
          text-decoration: underline;
        }
        .mobile-nav-link {
          text-decoration: none;
          color: #333;
          font-weight: 500;
          font-size: 16px;
          padding: 12px 15px;
          border-radius: 10px;
          transition: 0.3s;
        }
        .mobile-nav-link:hover {
          background: #f5f8fb;
          color: #2e8b57;
        }
      `}</style>
    </header>
  );
}
