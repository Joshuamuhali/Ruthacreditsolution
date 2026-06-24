-- Rutha LMS Database Schema
-- Run this in your Supabase SQL Editor

-- 1. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'loan_ops', 'admin')) DEFAULT 'client',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. CLIENTS
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  nrc TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 3. APPLICATIONS
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  nrc TEXT NOT NULL,
  income DECIMAL(12,2) NOT NULL,
  loan_type TEXT NOT NULL,
  requested_amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')) DEFAULT 'submitted',
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 4. LOANS
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  client_id UUID REFERENCES clients(id),
  approved_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  loan_term_months INTEGER NOT NULL,
  due_date DATE NOT NULL,
  interest_amount DECIMAL(12,2) GENERATED ALWAYS AS (approved_amount * interest_rate / 100) STORED,
  total_repayable DECIMAL(12,2) GENERATED ALWAYS AS (approved_amount + (approved_amount * interest_rate / 100)) STORED,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('approved', 'funded', 'active', 'completed', 'overdue', 'defaulted')) DEFAULT 'approved',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- 5. DISBURSEMENTS
CREATE TABLE disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) NOT NULL,
  transaction_id TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  amount_sent DECIMAL(12,2) NOT NULL,
  date_sent DATE NOT NULL,
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;

-- 6. REPAYMENTS
CREATE TABLE repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;

-- 7. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- INDEXES
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_client ON applications(client_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_client ON loans(client_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- RLS POLICIES

-- Profiles: users can read own, admins read all
CREATE POLICY profiles_self ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_admin ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Applications: clients see own, ops/admin see all
CREATE POLICY applications_client ON applications FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY applications_staff ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);

-- Loans: clients see own, ops/admin see all
CREATE POLICY loans_client ON loans FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY loans_staff ON loans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);

-- Disbursements: staff only
CREATE POLICY disbursements_staff ON disbursements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);
CREATE POLICY disbursements_client ON disbursements FOR SELECT USING (
  loan_id IN (SELECT id FROM loans WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
);

-- Repayments: staff only
CREATE POLICY repayments_staff ON repayments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);
CREATE POLICY repayments_client ON repayments FOR SELECT USING (
  loan_id IN (SELECT id FROM loans WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
);

-- Audit logs: staff only
CREATE POLICY audit_staff ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);
CREATE POLICY audit_admin ON audit_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications: users see own
CREATE POLICY notifications_self ON notifications FOR ALL USING (user_id = auth.uid());

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- AUDIT LOG FUNCTION
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_user_name TEXT,
  p_action TEXT,
  p_entity TEXT,
  p_entity_id TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details)
  VALUES (p_user_id, p_user_name, p_action, p_entity, p_entity_id, p_details)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;