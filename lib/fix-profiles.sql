-- Fix existing profiles to have valid kyc_status and loan_eligibility_status
UPDATE profiles
SET kyc_status = 'not_started'
WHERE kyc_status IS NULL OR kyc_status NOT IN ('not_started', 'in_progress', 'submitted', 'under_review', 'completed', 'rejected');

UPDATE profiles
SET loan_eligibility_status = CASE 
  WHEN kyc_status = 'completed' THEN 'eligible'
  ELSE 'not_eligible'
END
WHERE loan_eligibility_status IS NULL;

-- Recreate notification trigger with error handling
CREATE OR REPLACE FUNCTION create_kyc_review_notification()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    -- Submitted → notify loan ops + admin
    IF NEW.kyc_status = 'submitted'
       AND (OLD.kyc_status IS DISTINCT FROM 'submitted') THEN

      INSERT INTO notifications (user_id, title, message, type)
      SELECT
        p.id,
        'New KYC Submission',
        'User ' || COALESCE(NEW.full_name, NEW.email) || ' submitted KYC',
        'system'
      FROM profiles p
      WHERE p.role IN ('loan_ops', 'admin');
    END IF;

    -- Approved → notify user
    IF NEW.kyc_status = 'completed'
       AND (OLD.kyc_status IS DISTINCT FROM 'completed') THEN

      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        NEW.id,
        'KYC Approved',
        'Your KYC is approved. You can now apply for loans.',
        'approval'
      );
    END IF;

    -- Rejected → notify user
    IF NEW.kyc_status = 'rejected'
       AND (OLD.kyc_status IS DISTINCT FROM 'rejected') THEN

      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        NEW.id,
        'KYC Rejected',
        'KYC rejected. Reason: ' ||
        COALESCE(NEW.kyc_rejection_reason, 'Not provided'),
        'rejection'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Don't fail the update if notification fails
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_kyc_status_notification ON profiles;

CREATE TRIGGER on_kyc_status_notification
AFTER UPDATE OF kyc_status ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_kyc_review_notification();
