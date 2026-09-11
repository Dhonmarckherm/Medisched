"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailIcon, LockIcon, UserIcon, IdCardIcon, HospitalIcon, ArrowLeftIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";

const COURSES = [
  "BSHM",
  "BSTM",
  "BSED",
  "BSIT",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

// Student ID validation: D19-### to D(current year)-##### 
// Format: D##-### to D##-##### (e.g., D23-003, D23-00033)
const CURRENT_YEAR_SHORT = new Date().getFullYear() % 100; // e.g., 26 for 2026
const MIN_YEAR_SHORT = 19;

function validateStudentId(id: string): string {
  const trimmed = id.trim().toUpperCase();
  if (!trimmed) return "ID number is required";
  
  // Check format: D##-### to D##-##### (2 digit year, dash, 3-5 digit sequence)
  const match = trimmed.match(/^D(\d{2})-(\d{3,5})$/);
  if (!match) return "ID must be in format D##-### (e.g., D23-003 or D23-00033)";
  
  const yearNum = parseInt(match[1], 10);
  if (yearNum < MIN_YEAR_SHORT) return `ID year must be ${MIN_YEAR_SHORT} or later (e.g., D${MIN_YEAR_SHORT}-###)`;
  if (yearNum > CURRENT_YEAR_SHORT) return `ID cannot be from the future (max D${CURRENT_YEAR_SHORT})`;
  
  return "";
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", middleName: "", email: "", idNumber: "",
    password: "", confirmPassword: "", course: "", yearLevel: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
      case "lastName":
        return value.trim() ? "" : "This field is required";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email format";
      case "idNumber":
        return validateStudentId(value);
      case "password":
        return value.length >= 6 ? "" : "Password must be at least 6 characters";
      case "confirmPassword":
        return value === formData.password ? "" : "Passwords do not match";
      case "course":
      case "yearLevel":
        return value ? "" : "This field is required";
      default:
        return "";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).some(k => newErrors[k])) {
      setErrors(newErrors);
      addToast("error", "Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName, last_name: formData.lastName,
          middle_name: formData.middleName || null, email: formData.email,
          id_number: formData.idNumber, password: formData.password,
          course: formData.course, year_level: formData.yearLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Registration failed");
        setLoading(false);
        return;
      }
      addToast("success", "Account created! Check your email to verify and activate your account.");
      setTimeout(() => router.push("/login?registered=true"), 2000);
    } catch {
      addToast("error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row relative">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-xl px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-primary rounded-full" style={{ animation: "spin 0.8s linear infinite" }} />
            <p className="text-[14px] font-medium text-gray-600 m-0">Creating account...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Back to Home */}
      <Link href="/" className="absolute top-5 left-5 flex items-center gap-1.5 text-white/80 hover:text-white no-underline text-[13px] font-medium transition">
        <ArrowLeftIcon size={14} /> Back to Home
      </Link>

      {/* Left Panel */}
      <div className="w-full lg:w-1/2 bg-primary text-white flex flex-col justify-center items-center p-12">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
          <HospitalIcon className="text-white" size={32} />
        </div>
        <h1 className="text-[36px] font-bold mb-3 text-center">Join Us Today</h1>
        <p className="text-[16px] text-center opacity-80 max-w-[360px]">
          Create your account to start scheduling appointments and requesting certificates.
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-white p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
          <h2 className="text-[26px] font-bold text-[#1a1a2e] mb-2">Create Account</h2>
          <p className="text-gray-400 text-[14px] mb-8">Fill in your details to get started</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">First Name</label>
                <div className={`flex items-center border rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${errors.firstName ? 'border-red-300' : 'border-gray-200'}`}>
                  <UserIcon className="text-gray-400 mr-2" size={18} />
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} required
                    className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="First" />
                </div>
                {errors.firstName && <p className="text-red-500 text-[12px] mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Last Name</label>
                <div className={`flex items-center border rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${errors.lastName ? 'border-red-300' : 'border-gray-200'}`}>
                  <UserIcon className="text-gray-400 mr-2" size={18} />
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} required
                    className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="Last" />
                </div>
                {errors.lastName && <p className="text-red-500 text-[12px] mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Middle Name</label>
              <div className="flex items-center border border-gray-200 rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <UserIcon className="text-gray-400 mr-2 flex-shrink-0" size={18} />
                <input type="text" name="middleName" value={formData.middleName} onChange={handleChange}
                  className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="Middle (optional)" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Email</label>
              <div className={`flex items-center border rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}>
                <MailIcon className="text-gray-400 mr-2" size={18} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required
                  className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="you@email.com" />
              </div>
              {errors.email && <p className="text-red-500 text-[12px] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">ID Number</label>
              <div className={`flex items-center border rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${errors.idNumber ? 'border-red-300' : 'border-gray-200'}`}>
                <IdCardIcon className="text-gray-400 mr-2" size={18} />
                <input type="text" name="idNumber" value={formData.idNumber} onChange={handleChange} onBlur={handleBlur} required
                  className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="e.g., D23-00033" />
              </div>
              {errors.idNumber && <p className="text-red-500 text-[12px] mt-1">{errors.idNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Course</label>
                <select name="course" value={formData.course} onChange={handleChange} onBlur={handleBlur} required
                  className={`w-full py-3 border rounded-lg px-3 text-[14px] bg-white text-gray-700 outline-none focus:border-primary ${errors.course ? 'border-red-300' : 'border-gray-200'}`}>
                  <option value="">Select course</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.course && <p className="text-red-500 text-[12px] mt-1">{errors.course}</p>}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Year Level</label>
                <select name="yearLevel" value={formData.yearLevel} onChange={handleChange} onBlur={handleBlur} required
                  className={`w-full py-3 border rounded-lg px-3 text-[14px] bg-white text-gray-700 outline-none focus:border-primary ${errors.yearLevel ? 'border-red-300' : 'border-gray-200'}`}>
                  <option value="">Select year</option>
                  {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.yearLevel && <p className="text-red-500 text-[12px] mt-1">{errors.yearLevel}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Password</label>
              <div className={`flex items-center border rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${errors.password ? 'border-red-300' : 'border-gray-200'}`}>
                <LockIcon className="text-gray-400 mr-2" size={18} />
                <input type="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} required minLength={6}
                  className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="Min 6 characters" />
              </div>
              {errors.password && <p className="text-red-500 text-[12px] mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Confirm Password</label>
              <div className={`flex items-center border rounded-full px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`}>
                <LockIcon className="text-gray-400 mr-2" size={18} />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} required minLength={6}
                  className="w-full py-3 border-none outline-none focus:outline-none focus:ring-0 text-[14px] bg-transparent" placeholder="Re-enter password" />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-[12px] mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white border-none rounded-lg cursor-pointer text-[14px] font-medium mt-6 hover:bg-primary-hover transition disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="mt-5 text-center text-[13px] text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-primary no-underline font-medium">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
