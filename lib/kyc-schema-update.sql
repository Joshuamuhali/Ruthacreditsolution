-- KYC Schema Update for Manual Verification Workflow
-- Run this in your Supabase SQL Editor to add missing KYC fields

-- 1. Update kyc_status check constraint to include new states
ALTER TABLE profiles DROP CONSTRAINT profiles_kyc_status_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_kyc_status_check 
CHECK (kyc_status IN ('not_started', 'in_progress', 'submitted', 'under_review', 'completed', 'rejected'));

-- 2. Add KYC verification fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_verified_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- 3. Add loan eligibility status field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS loan_eligibility_status TEXT 
DEFAULT 'not_eligible' 
CHECK (loan_eligibility_status IN ('not_eligible', 'eligible', 'suspended'));

-- 4. Add indexes for KYC review queries
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_loan_eligibility ON profiles(loan_eligibility_status);

-- 5. Create function to update loan eligibility when KYC is approved
CREATE OR REPLACE FUNCTION update_loan_eligibility_on_kyc_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kyc_status = 'completed' AND OLD.kyc_status != 'completed' THEN
    NEW.loan_eligibility_status = 'eligible';
    NEW.kyc_verified_at = now();
  ELSIF NEW.kyc_status = 'rejected' THEN
    NEW.loan_eligibility_status = 'not_eligible';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for automatic loan eligibility update
DROP TRIGGER IF EXISTS on_kyc_status_change ON profiles;
CREATE TRIGGER on_kyc_status_change
  BEFORE UPDATE OF kyc_status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_eligibility_on_kyc_approval();

-- 7. Create function to create KYC review notification
CREATE OR REPLACE FUNCTION create_kyc_review_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kyc_status = 'submitted' AND (OLD.kyc_status IS NULL OR OLD.kyc_status != 'submitted') THEN
    -- Notify loan officers about new KYC submission
    INSERT INTO notifications (user_id, title, message, type)
    SELECT 
      p.id, 
      'New KYC Submission', 
      'User ' || NEW.full_name || ' has submitted KYC for review',
      'system'
    FROM profiles p
    WHERE p.role IN ('loan_ops', 'admin');
  ELSIF NEW.kyc_status = 'completed' AND OLD.kyc_status != 'completed' THEN
    -- Notify user about KYC approval
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'KYC Approved - You are Eligible for Loans',
      'Congratulations! Your KYC has been approved. You are now eligible to apply for loans.',
      'approval'
    );
  ELSIF NEW.kyc_status = 'rejected' AND OLD.kyc_status != 'rejected' THEN
    -- Notify user about KYC rejection
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'KYC Review Required',
      'Your KYC requires attention. Reason: ' || COALESCE(NEW.kyc_rejection_reason, 'Please contact support'),
      'rejection'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for KYC notifications
DROP TRIGGER IF EXISTS on_kyc_status_notification ON profiles;
CREATE TRIGGER on_kyc_status_notification
  AFTER UPDATE OF kyc_status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_kyc_review_notification();
