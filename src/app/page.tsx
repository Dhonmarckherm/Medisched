import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { CalendarIcon, CertificateIcon, CheckCircleIcon, ArrowRightIcon, HospitalIcon, ShieldIcon } from "@/components/Icons";

export default async function HomePage() {
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
    // Not logged in
  }

  return (
    <div className="min-h-screen">
      <Navbar user={dbUser} />

      {/* Hero */}
      <section className="relative pt-[130px] min-h-screen flex items-center overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/30 to-white"></div>
        <div className="absolute top-[120px] right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 w-[90%] max-w-[1200px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full text-[13px] font-medium mb-6 border border-primary/10">
              <HospitalIcon size={16} />
              ISPSC Medical Clinic Portal
            </div>
            <h1 className="text-[42px] lg:text-[60px] font-bold text-[#1a1a2e] leading-[1.1] mb-6 tracking-tight">
              Medical Scheduling<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">&amp; Certification</span><br />
              Made Simple
            </h1>
            <p className="text-[17px] leading-[28px] text-gray-500 max-w-[520px] mb-10">
              Streamline your clinic visits with easy appointment booking,
              health certificate requests, and real-time status tracking — all
              in one modern platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white rounded-xl font-medium text-[15px] no-underline hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">
                Get Started Free <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-[15px] no-underline hover:border-primary hover:text-primary transition-all">
                Sign In
              </Link>
            </div>
            {/* Trust indicators */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-gray-100">
              <div>
                <div className="text-[24px] font-bold text-[#1a1a2e]">500+</div>
                <div className="text-[12px] text-gray-400 font-medium">Students Served</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div>
                <div className="text-[24px] font-bold text-[#1a1a2e]">Fast</div>
                <div className="text-[12px] text-gray-400 font-medium">Processing Time</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div>
                <div className="text-[24px] font-bold text-[#1a1a2e]">24/7</div>
                <div className="text-[12px] text-gray-400 font-medium">Online Access</div>
              </div>
            </div>
          </div>

          {/* Hero Card */}
          <div className="flex-1 flex justify-center">
              <div className="w-[340px] sm:w-[380px] bg-white rounded-2xl p-6 shadow-xl border border-gray-100/80">
                {/* Header bar */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                    <HospitalIcon className="text-white" size={20} />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#1a1a2e]">MEDISCHED CERT</div>
                    <div className="text-[11px] text-gray-400">Medical Clinic Portal</div>
                  </div>
                </div>
                {/* Stats row */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-3.5 border border-blue-100/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><CalendarIcon size={14} /></div>
                    </div>
                    <div className="text-[22px] font-bold text-[#1a1a2e]">24</div>
                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">Appointments</div>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-xl p-3.5 border border-purple-100/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600"><CertificateIcon size={14} /></div>
                    </div>
                    <div className="text-[22px] font-bold text-[#1a1a2e]">18</div>
                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">Certificates</div>
                  </div>
                </div>
                {/* Activity list */}
                <div className="bg-gray-50/80 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">Recent Activity</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 rounded-full bg-amber-400"></div></div>
                      <span className="text-[12px] text-gray-600 flex-1">Appointment request submitted</span>
                      <span className="text-[10px] text-gray-400">2m</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 rounded-full bg-emerald-400"></div></div>
                      <span className="text-[12px] text-gray-600 flex-1">Certificate approved</span>
                      <span className="text-[10px] text-gray-400">15m</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 rounded-full bg-blue-400"></div></div>
                      <span className="text-[12px] text-gray-600 flex-1">New patient registered</span>
                      <span className="text-[10px] text-gray-400">1h</span>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full text-[12px] font-semibold mb-4 uppercase tracking-wider">
              Features
            </div>
            <h2 className="text-[36px] font-bold text-[#1a1a2e] mb-4 tracking-tight">Everything You Need</h2>
            <p className="text-[16px] text-gray-500 max-w-[500px] mx-auto">
              A complete digital solution for managing your clinic visits and health documents
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <CalendarIcon size={26} />
              </div>
              <h3 className="text-[20px] font-bold text-[#1a1a2e] mb-3">Easy Scheduling</h3>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-5">
                Book clinic appointments in seconds. Select your preferred date, time, and purpose — no paperwork needed.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-primary text-[14px] font-semibold no-underline group-hover:gap-3 transition-all">
                Get Started <ArrowRightIcon size={14} />
              </Link>
            </div>
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <CertificateIcon size={26} />
              </div>
              <h3 className="text-[20px] font-bold text-[#1a1a2e] mb-3">Certificate Requests</h3>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-5">
                Request health certificates digitally. Track progress and get notified when your document is ready for pickup.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-primary text-[14px] font-semibold no-underline group-hover:gap-3 transition-all">
                Get Started <ArrowRightIcon size={14} />
              </Link>
            </div>
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldIcon size={26} />
              </div>
              <h3 className="text-[20px] font-bold text-[#1a1a2e] mb-3">Real-Time Tracking</h3>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-5">
                Monitor the status of all your requests in real-time. Get instant updates on approvals and completions.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-primary text-[14px] font-semibold no-underline group-hover:gap-3 transition-all">
                Get Started <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#f8faf9]">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full text-[12px] font-semibold mb-4 uppercase tracking-wider">
              How It Works
            </div>
            <h2 className="text-[36px] font-bold text-[#1a1a2e] mb-4 tracking-tight">Simple 3-Step Process</h2>
            <p className="text-[16px] text-gray-500 max-w-[500px] mx-auto">
              Get your appointment or certificate in just a few easy steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-[24px] font-bold mx-auto mb-6 shadow-lg shadow-primary/20">1</div>
              <h3 className="text-[18px] font-bold text-[#1a1a2e] mb-3">Create Account</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">Sign up with your student ID and complete your profile in under a minute.</p>
              {/* Connector line (hidden on mobile) */}
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/30 to-transparent"></div>
            </div>
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-[24px] font-bold mx-auto mb-6 shadow-lg shadow-primary/20">2</div>
              <h3 className="text-[18px] font-bold text-[#1a1a2e] mb-3">Submit Request</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">Book an appointment or request a certificate through our simple forms.</p>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/30 to-transparent"></div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-[24px] font-bold mx-auto mb-6 shadow-lg shadow-primary/20">3</div>
              <h3 className="text-[18px] font-bold text-[#1a1a2e] mb-3">Get Notified</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">Wait for approval and track your request status in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="w-[90%] max-w-[800px] mx-auto text-center">
          <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-3xl p-10 sm:p-14 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
            <div className="relative z-10">
              <h2 className="text-[32px] sm:text-[36px] font-bold mb-4 tracking-tight">Ready to Get Started?</h2>
              <p className="text-white/80 text-[16px] mb-8 max-w-[400px] mx-auto">
                Join hundreds of students already using MEDISCHED CERT for their clinic needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-xl font-semibold text-[15px] no-underline hover:bg-white/90 transition shadow-lg">
                  Create Account <ArrowRightIcon size={16} />
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 bg-white/15 text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] no-underline hover:bg-white/25 transition border border-white/20">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto text-center">
          <p className="text-[13px] text-gray-400 m-0">
            &copy; 2026 MEDISCHED CERT — Ilocos Sur Polytechnic State College
          </p>
        </div>
      </footer>
    </div>
  );
}
