-- Rutha LMS Database Schema v2
-- Strict multi-stage underwriting + collateral + disbursement workflow
-- Run this in your Supabase SQL Editor

-- 1. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'loan_ops', 'admin')) DEFAULT 'client',
  phone TEXT,
  kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'in_progress', 'completed', 'rejected')),
  kyc_progress INTEGER DEFAULT 0 CHECK (kyc_progress >= 0 AND kyc_progress <= 100),
  employment_info TEXT,
  business_info TEXT,
  national_id_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. LOAN APPLICATIONS (workflow engine)
-- Handles: submission, review, collateral, approval, disbursement readiness
CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  full_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  purpose TEXT NOT NULL,
  term_months INTEGER NOT NULL,
  -- Stage A: Application
  -- Stage B: Collateral
  -- Stage C: Decision
  -- Stage D: Disbursement
  status TEXT NOT NULL CHECK (status IN (
    'submitted', 'under_review',
    'collateral_required', 'collateral_uploaded', 'collateral_verified', 'collateral_rejected',
    'approved', 'rejected',
    'awaiting_disbursement', 'disbursed'
  )) DEFAULT 'submitted',
  assessment_status TEXT DEFAULT 'pending' CHECK (assessment_status IN ('pending', 'processing', 'completed')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  credit_tier TEXT DEFAULT 'bronze' CHECK (credit_tier IN ('bronze', 'silver', 'gold')),
  notes TEXT,
  document_urls JSONB DEFAULT '[]',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

-- 3. COLLATERALS
CREATE TABLE collaterals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES loan_applications(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('land', 'car', 'item', 'document')),
  description TEXT NOT NULL,
  estimated_value DECIMAL(12,2) DEFAULT 0,
  files JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE collaterals ENABLE ROW LEVEL SECURITY;

-- 4. LOANS (financial contract - created ONLY after disbursement)
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES loan_applications(id) NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  principal DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  total_repayable DECIMAL(12,2) NOT NULL,
  remaining_balance DECIMAL(12,2) NOT NULL,
  loan_term_months INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'defaulted')) DEFAULT 'active',
  disbursed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- 5. REPAYMENT SCHEDULE (generated when loan is created)
CREATE TABLE repayment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE repayment_schedule ENABLE ROW LEVEL SECURITY;

-- 6. PAYMENTS (only allowed on loans with active status)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method TEXT DEFAULT 'mobile_money',
  reference_number TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 7. LOAN EVENTS (audit trail)
CREATE TABLE loan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES loan_applications(id),
  loan_id UUID REFERENCES loans(id),
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;

-- 8. NOTIFICATIONS (event-driven)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system' CHECK (type IN ('approval', 'rejection', 'payment', 'overdue', 'reminder', 'system', 'collateral', 'disbursement', 'office_visit')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 9. CLIENTS (legacy, admin-facing)
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

-- 10. APPLICATIONS (legacy, admin-facing)
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

-- 11. DISBURSEMENTS (legacy)
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

-- 12. REPAYMENTS (legacy, admin-facing)
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

-- 13. AUDIT LOGS (legacy)
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

-- ===== INDEXES =====
CREATE INDEX idx_loan_applications_user ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_collaterals_app ON collaterals(application_id);
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_repayment_schedule_loan ON repayment_schedule(loan_id);
CREATE INDEX idx_repayment_schedule_status ON repayment_schedule(status);
CREATE INDEX idx_payments_loan ON payments(loan_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_loan_events_app ON loan_events(application_id);
CREATE INDEX idx_loan_events_loan ON loan_events(loan_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- ===== RLS POLICIES =====

-- Profiles
CREATE POLICY profiles_self ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_self_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_admin ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Loan Applications
CREATE POLICY loan_applications_self ON loan_applications FOR ALL USING (user_id = auth.uid());
CREATE POLICY loan_applications_staff ON loan_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);

-- Collaterals
CREATE POLICY collaterals_self ON collaterals FOR SELECT USING (
  application_id IN (SELECT id FROM loan_applications WHERE user_id = auth.uid())
);
CREATE POLICY collaterals_self_insert ON collaterals FOR INSERT WITH CHECK (
  application_id IN (SELECT id FROM loan_applications WHERE user_id = auth.uid())
);
CREATE POLICY collaterals_staff ON collaterals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);

-- Loans
CREATE POLICY loans_self ON loans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY loans_staff ON loans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);

-- Repayment Schedule
CREATE POLICY repayment_schedule_self ON repayment_schedule FOR SELECT USING (
  loan_id IN (SELECT id FROM loans WHERE user_id = auth.uid())
);
CREATE POLICY repayment_schedule_staff ON repayment_schedule FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);

-- Payments
CREATE POLICY payments_self ON payments FOR ALL USING (user_id = auth.uid());
CREATE POLICY payments_staff ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);

-- Loan Events
CREATE POLICY loan_events_self ON loan_events FOR SELECT USING (
  application_id IN (SELECT id FROM loan_applications WHERE user_id = auth.uid())
);
CREATE POLICY loan_events_staff ON loan_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);

-- Notifications
CREATE POLICY notifications_self ON notifications FOR ALL USING (user_id = auth.uid());

-- Legacy tables
CREATE POLICY applications_client ON applications FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY applications_staff ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);
CREATE POLICY disbursements_staff ON disbursements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);
CREATE POLICY repayments_staff ON repayments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);
CREATE POLICY audit_staff ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('loan_ops', 'admin'))
);
CREATE POLICY audit_admin ON audit_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ===== AUTO-CREATE PROFILE ON SIGNUP =====
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

-- ===== HELPER FUNCTIONS =====

-- Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'system'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Create loan event
CREATE OR REPLACE FUNCTION create_loan_event(
  p_event_type TEXT,
  p_application_id UUID DEFAULT NULL,
  p_loan_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO loan_events (event_type, application_id, loan_id, metadata, created_by)
  VALUES (p_event_type, p_application_id, p_loan_id, p_metadata, p_created_by)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Generate repayment schedule when loan is created
CREATE OR REPLACE FUNCTION generate_repayment_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly_payment DECIMAL(12,2);
  v_due_date DATE;
  v_i INTEGER;
BEGIN
  v_monthly_payment := NEW.total_repayable / NEW.loan_term_months;
  v_due_date := NEW.disbursed_at::DATE;

  FOR v_i IN 1..NEW.loan_term_months LOOP
    v_due_date := v_due_date + INTERVAL '1 month';
    INSERT INTO repayment_schedule (loan_id, installment_number, due_date, amount_due)
    VALUES (NEW.id, v_i, v_due_date, v_monthly_payment);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_loan_created
  AFTER INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION generate_repayment_schedule();