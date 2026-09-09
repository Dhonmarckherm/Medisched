import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar user={null} />

      {/* Hero Section */}
      <section
        className="pt-[130px] min-h-screen flex items-center"
        style={{ background: "linear-gradient(135deg, #eef7ff, #ffffff)" }}
      >
        <div className="w-[90%] max-w-[1200px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-[60px]">
          <div className="fade-up flex-1">
            <small className="text-primary text-[18px] font-semibold">
              Welcome to MEDISCHED CERT
            </small>
            <h1 className="text-[42px] lg:text-[62px] font-extrabold text-[#222] my-4 leading-tight tracking-wide">
              Medical Scheduling &<br />Certification System
            </h1>
            <div className="w-[90px] h-[5px] bg-primary rounded-full mb-5" />
            <h3 className="text-[30px] text-primary mb-5">
              ISPSC Clinic Portal
            </h3>
            <p className="text-[18px] leading-[32px] text-[#555] max-w-[700px]">
              Your one-stop system for clinic appointment scheduling and
              certificate requests. Manage appointments, request health
              certificates, and stay organized — all in one place.
            </p>
            <div className="mt-[35px] flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href="/login"
                className="bg-white text-primary border-2 border-primary rounded-full px-7 py-3 font-semibold text-[16px] no-underline hover:bg-primary-hover hover:text-white hover:-translate-y-0.5"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-white border-2 border-primary rounded-full px-8 py-3.5 font-semibold text-[16px] no-underline hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center fade-in">
            <div className="text-center">
              <div className="text-[120px] leading-none">🏥</div>
              <p className="text-[#555] text-[16px] mt-4">
                Ilocos Sur Polytechnic State College
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="py-[80px] bg-white">
        <div className="w-[90%] max-w-[1200px] mx-auto text-center">
          <h2 className="text-[42px] font-bold text-[#222] mb-4">
            Our Services
          </h2>
          <p className="text-[18px] text-[#555] mb-[50px] max-w-[600px] mx-auto">
            Streamlined healthcare management for students
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px]">
            <div className="service-card bg-white p-[40px_30px] rounded-[20px] text-center shadow-lg hover:-translate-y-2.5 hover:shadow-xl">
              <div className="text-[60px] text-primary mb-6">📅</div>
              <h3 className="text-[22px] font-semibold mb-4">
                Easy Scheduling
              </h3>
              <p className="text-[16px] text-[#555] mb-5">
                Request clinic appointments with just a few clicks. Choose your
                preferred date and purpose.
              </p>
              <Link
                href="/appointments/new"
                className="inline-block py-3 px-7 rounded-full bg-primary text-white no-underline font-semibold hover:bg-primary-hover"
              >
                Book Now
              </Link>
            </div>
            <div className="service-card bg-white p-[40px_30px] rounded-[20px] text-center shadow-lg hover:-translate-y-2.5 hover:shadow-xl">
              <div className="text-[60px] text-primary mb-6">📜</div>
              <h3 className="text-[22px] font-semibold mb-4">
                Certificate Requests
              </h3>
              <p className="text-[16px] text-[#555] mb-5">
                Submit and track health certificate requests. Get notified when
                your certificate is ready.
              </p>
              <Link
                href="/certificates/new"
                className="inline-block py-3 px-7 rounded-full bg-primary text-white no-underline font-semibold hover:bg-primary-hover"
              >
                Request Now
              </Link>
            </div>
            <div className="service-card bg-white p-[40px_30px] rounded-[20px] text-center shadow-lg hover:-translate-y-2.5 hover:shadow-xl">
              <div className="text-[60px] text-primary mb-6">✅</div>
              <h3 className="text-[22px] font-semibold mb-4">
                Status Tracking
              </h3>
              <p className="text-[16px] text-[#555] mb-5">
                Track the status of your appointments and certificates in
                real-time with instant updates.
              </p>
              <Link
                href="/login"
                className="inline-block py-3 px-7 rounded-full bg-primary text-white no-underline font-semibold hover:bg-primary-hover"
              >
                Track Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[3px] border-primary text-center py-5 text-[14px] bg-[#f9f9f9] text-[#333]">
        <p className="m-0 leading-[1.6]">
          © 2026 MEDISCHED CERT — Ilocos Sur Polytechnic State College
        </p>
        <p className="text-[13px] text-[#555] mt-1">
          Medical Scheduling and Certification Request System
        </p>
        <div className="mt-2.5">
          <Link href="/login" className="text-primary no-underline mx-2.5 font-medium hover:underline">Login</Link>
          <Link href="/signup" className="text-primary no-underline mx-2.5 font-medium hover:underline">Sign Up</Link>
          <Link href="/appointments" className="text-primary no-underline mx-2.5 font-medium hover:underline">Appointments</Link>
        </div>
      </footer>
    </div>
  );
}
