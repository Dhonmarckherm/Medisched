-- ============================================
-- MEDISCHED CERT - Database Schema for Supabase
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    id_number VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    course VARCHAR(100),
    year_level VARCHAR(20),
    contact_number VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'nurse', 'admin')),
    active_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (active_status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lastname VARCHAR(100) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    middlename VARCHAR(100),
    student_id VARCHAR(50) NOT NULL,
    course VARCHAR(100),
    year_level VARCHAR(20),
    appointment_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    remarks TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lastname VARCHAR(100) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    middlename VARCHAR(100),
    student_id VARCHAR(50) NOT NULL,
    course VARCHAR(100),
    year_level VARCHAR(20),
    purpose TEXT NOT NULL,
    date_needed DATE NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    remarks TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    available_from DATE NOT NULL,
    available_to DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES (safe to re-run)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active_status ON public.users(active_status);

-- ============================================
-- FUNCTIONS (must be created BEFORE policies that reference them)
-- ============================================

-- Helper function to check user role (SECURITY DEFINER bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin_or_nurse()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role IN ('admin', 'nurse')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to get user id from auth uid
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.users WHERE auth_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins and nurses can view all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Students can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins and nurses can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins and nurses can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Students can view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins and nurses can view all certificates" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can insert certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins and nurses can update certificates" ON public.certificates;
DROP POLICY IF EXISTS "Everyone can view accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Admins and nurses can insert accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Admins and nurses can update accommodations" ON public.accommodations;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Admins and nurses can view all users" ON public.users
    FOR SELECT USING (public.is_admin_or_nurse());

CREATE POLICY "Anyone can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (public.is_admin_or_nurse());

-- Appointments policies
CREATE POLICY "Students can view own appointments" ON public.appointments
    FOR SELECT USING (user_id = public.current_user_id());

CREATE POLICY "Admins and nurses can view all appointments" ON public.appointments
    FOR SELECT USING (public.is_admin_or_nurse());

CREATE POLICY "Anyone can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and nurses can update appointments" ON public.appointments
    FOR UPDATE USING (public.is_admin_or_nurse());

-- Certificates policies
CREATE POLICY "Students can view own certificates" ON public.certificates
    FOR SELECT USING (user_id = public.current_user_id());

CREATE POLICY "Admins and nurses can view all certificates" ON public.certificates
    FOR SELECT USING (public.is_admin_or_nurse());

CREATE POLICY "Anyone can insert certificates" ON public.certificates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and nurses can update certificates" ON public.certificates
    FOR UPDATE USING (public.is_admin_or_nurse());

-- Accommodations policies
CREATE POLICY "Everyone can view accommodations" ON public.accommodations
    FOR SELECT USING (true);

CREATE POLICY "Admins and nurses can insert accommodations" ON public.accommodations
    FOR INSERT WITH CHECK (public.is_admin_or_nurse());

CREATE POLICY "Admins and nurses can update accommodations" ON public.accommodations
    FOR UPDATE USING (public.is_admin_or_nurse());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_certificates_updated_at ON public.certificates;
DROP TRIGGER IF EXISTS update_accommodations_updated_at ON public.accommodations;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON public.accommodations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
