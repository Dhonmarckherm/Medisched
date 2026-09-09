import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { CalendarIcon, CertificateIcon, CheckCircleIcon, ArrowRightIcon, HospitalIcon, StethoscopeIcon, ClipboardIcon, ActivityIcon } from "@/components/Icons";

export default async function HomePage() {
  // Detect logged-in user so Navbar shows correct state
  let dbUser = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("first_name, last_name, role")
        .eq("auth_id", user.id)
        .single();
      dbUser = data;
    }
  } catch {
    // Not logged in, that's fine
  }

  return (
    <div className="min-h-screen">
      <Navbar user={dbUser} />

      {/* Hero */}
      <section className="pt-[130px] min-h-screen flex items-center bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full text-[13px] font-medium mb-6">
              <HospitalIcon size={16} />
              ISPSC Medical Clinic Portal
            </div>
            <h1 className="text-[40px] lg:text-[56px] font-bold text-[#1a1a2e] leading-[1.15] mb-6">
              Medical Scheduling &<br />Certification System
            </h1>
            <p className="text-[17px] leading-[28px] text-gray-500 max-w-[560px] mb-8">
              Your one-stop system for clinic appointment scheduling and
              certificate requests. Manage appointments, request health
              certificates, and stay organized — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium text-[15px] no-underline hover:border-primary hover:text-primary">
                Login
              </Link>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium text-[15px] no-underline hover:bg-primary-hover">
                Get Started <ArrowRightIcon size={16} />
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-[360px] h-[340px] bg-primary/5 rounded-2xl p-6 flex flex-col gap-4">
              {/* Header bar */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <HospitalIcon className="text-white" size={20} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#1a1a2e]">MEDISCHED CERT</div>
                  <div className="text-[11px] text-gray-400">Medical Clinic Portal</div>
                </div>
              </div>
              {/* Stats row */}
              <div className="flex gap-3">
                <div className="flex-1 bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600"><CalendarIcon size={14} /></div>
                    <span className="text-[10px] text-gray-400 font-medium">APPOINTMENTS</span>
                  </div>
                  <div className="text-[20px] font-bold text-[#1a1a2e]">24</div>
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600"><CertificateIcon size={14} /></div>
                    <span className="text-[10px] text-gray-400 font-medium">CERTIFICATES</span>
                  </div>
                  <div className="text-[20px] font-bold text-[#1a1a2e]">18</div>
                </div>
              </div>
              {/* Activity list */}
              <div className="bg-white rounded-lg border border-gray-100 p-3 flex-1">
                <div className="text-[11px] font-medium text-gray-400 mb-2">RECENT ACTIVITY</div>
                <div className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div></div>
                  <span className="text-[11px] text-gray-500 flex-1">Appointment request submitted</span>
                  <span className="text-[10px] text-gray-300">2m ago</span>
                </div>
                <div className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div></div>
                  <span className="text-[11px] text-gray-500 flex-1">Certificate approved</span>
                  <span className="text-[10px] text-gray-300">15m ago</span>
                </div>
                <div className="flex items-center gap-2 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div></div>
                  <span className="text-[11px] text-gray-500 flex-1">New patient registered</span>
                  <span className="text-[10px] text-gray-300">1h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-[#f8faf9]">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[32px] font-bold text-[#1a1a2e] mb-3">Our Services</h2>
            <p className="text-[16px] text-gray-500">Streamlined healthcare management for students</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
                <CalendarIcon size={24} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#1a1a2e] mb-3">Easy Scheduling</h3>
              <p className="text-[15px] text-gray-500 mb-5 leading-relaxed">
                Request clinic appointments with just a few clicks. Choose your preferred date and purpose.
              </p>
              <Link href="/appointments/new" className="inline-flex items-center gap-1.5 text-primary text-[14px] font-medium no-underline hover:gap-3 transition-all">
                Book Now <ArrowRightIcon size={14} />
              </Link>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
                <CertificateIcon size={24} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#1a1a2e] mb-3">Certificate Requests</h3>
              <p className="text-[15px] text-gray-500 mb-5 leading-relaxed">
                Submit and track health certificate requests. Get notified when your certificate is ready.
              </p>
              <Link href="/certificates/new" className="inline-flex items-center gap-1.5 text-primary text-[14px] font-medium no-underline hover:gap-3 transition-all">
                Request Now <ArrowRightIcon size={14} />
              </Link>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
                <CheckCircleIcon size={24} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#1a1a2e] mb-3">Status Tracking</h3>
              <p className="text-[15px] text-gray-500 mb-5 leading-relaxed">
                Track the status of your appointments and certificates in real-time with instant updates.
              </p>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-primary text-[14px] font-medium no-underline hover:gap-3 transition-all">
                Track Now <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto text-center">
          <p className="text-[14px] text-gray-400 m-0">
            &copy; 2026 MEDISCHED CERT — Ilocos Sur Polytechnic State College
          </p>
          <div className="mt-3 flex justify-center gap-6">
            <Link href="/login" className="text-gray-400 no-underline text-[13px] hover:text-primary">Login</Link>
            <Link href="/signup" className="text-gray-400 no-underline text-[13px] hover:text-primary">Sign Up</Link>
            <Link href="/appointments" className="text-gray-400 no-underline text-[13px] hover:text-primary">Appointments</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
