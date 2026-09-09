export interface User {
  id: string;
  auth_id: string;
  email: string;
  id_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  course?: string;
  year_level?: string;
  contact_number?: string;
  role: "student" | "nurse" | "admin";
  active_status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  lastname: string;
  firstname: string;
  middlename?: string;
  student_id: string;
  course?: string;
  year_level?: string;
  appointment_date: string;
  purpose: string;
  remarks?: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  lastname: string;
  firstname: string;
  middlename?: string;
  student_id: string;
  course?: string;
  year_level?: string;
  purpose: string;
  date_needed: string;
  contact_number?: string;
  email?: string;
  remarks?: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  updated_at: string;
}

export interface Accommodation {
  id: string;
  available_from: string;
  available_to: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalAppointments: number;
  totalCertificates: number;
  pendingAppointments: number;
  pendingCertificates: number;
}
