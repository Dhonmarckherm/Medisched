import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CalendarIcon, CertificateIcon, CheckCircleIcon, ArrowRightIcon, HospitalIcon } from "@/components/Icons";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar user={null} />

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
            <div className="w-[320px] h-[320px] bg-primary/5 rounded-2xl flex items-center justify-center">
              <HospitalIcon className="text-primary" size={120} />
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
