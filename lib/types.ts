export type UserRole = 'client' | 'loan_ops' | 'admin'

// KYC Status State Machine
export type KYCStatus = 
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'completed'
  | 'rejected'

// Loan Eligibility Status
export type LoanEligibilityStatus = 
  | 'not_eligible'
  | 'eligible'
  | 'suspended'

// ===== STATE MACHINE ENUMS =====

// Loan Application lifecycle (strict workflow)
export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  // Collateral stage
  | 'collateral_required'
  | 'collateral_uploaded'
  | 'collateral_verified'
  | 'collateral_rejected'
  // Decision stage
  | 'approved'
  | 'rejected'
  // Disbursement stage
  | 'awaiting_disbursement'
  | 'disbursed'

// Loan (financial contract - created AFTER disbursement)
export type LoanStatus = 'active' | 'completed' | 'defaulted'

export type AssessmentStatus = 'pending' | 'processing' | 'completed'

export type RiskLevel = 'low' | 'medium' | 'high'
export type CreditTier = 'bronze' | 'silver' | 'gold'

export type CollateralStatus = 'pending' | 'verified' | 'rejected'
export type CollateralType = 'land' | 'car' | 'item' | 'document'

export type NotificationType = 'approval' | 'rejection' | 'payment' | 'overdue' | 'reminder' | 'system' | 'collateral' | 'disbursement' | 'office_visit'

export type LoanEventType =
  | 'application_submitted'
  | 'review_started'
  | 'collateral_requested'
  | 'collateral_uploaded'
  | 'collateral_verified'
  | 'collateral_rejected'
  | 'assessment_processing'
  | 'assessment_completed'
  | 'approval_granted'
  | 'application_rejected'
  | 'office_visit_scheduled'
  | 'disbursement_completed'
  | 'payment_received'
  | 'loan_completed'
  | 'loan_defaulted'

// ===== INTERFACES =====

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  kyc_status: KYCStatus
  kyc_progress: number // 0-100
  loan_eligibility_status: LoanEligibilityStatus
  kyc_verified_at?: string
  kyc_verified_by?: string
  kyc_rejection_reason?: string
  employment_info?: string
  business_info?: string
  national_id_url?: string
  created_at: string
}

export interface LoanApplication {
  id: string
  user_id: string
  full_name: string
  amount: number
  purpose: string
  term_months: number
  status: ApplicationStatus
  assessment_status: AssessmentStatus
  risk_level: RiskLevel
  credit_tier: CreditTier
  notes?: string
  document_urls?: string[]
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface Collateral {
  id: string
  application_id: string
  type: CollateralType
  description: string
  estimated_value: number
  files: string[]
  status: CollateralStatus
  verified_by?: string
  verified_at?: string
  created_at: string
}

export interface Loan {
  id: string
  application_id: string
  user_id: string
  principal: number
  interest_rate: number
  total_repayable: number
  remaining_balance: number
  loan_term_months: number
  status: LoanStatus
  disbursed_at?: string
  created_at: string
}

export interface RepaymentSchedule {
  id: string
  loan_id: string
  installment_number: number
  due_date: string
  amount_due: number
  amount_paid: number
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  paid_at?: string
  created_at: string
}

export interface Payment {
  id: string
  loan_id: string
  user_id: string
  amount: number
  method: string
  reference_number?: string
  receipt_url?: string
  created_at: string
}

export interface LoanEvent {
  id: string
  application_id?: string
  loan_id?: string
  event_type: LoanEventType
  metadata?: Record<string, unknown>
  created_by?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  created_at: string
}

// Admin-facing (legacy)
export interface Application {
  id: string
  client_id: string
  full_name: string
  phone: string
  nrc: string
  income: number
  loan_type: string
  requested_amount: number
  status: string
  notes?: string
  submitted_at: string
  reviewed_by?: string
  reviewed_at?: string
}

export interface Disbursement {
  id: string
  loan_id: string
  transaction_id: string
  reference_number: string
  amount_sent: number
  date_sent: string
  confirmed_by: string
  confirmed_at: string
}

export interface Repayment {
  id: string
  loan_id: string
  amount: number
  payment_date: string
  payment_method: string
  reference_number?: string
  recorded_by: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: string
  entity: string
  entity_id: string
  details?: Record<string, unknown>
  created_at: string
}

export interface DashboardMetrics {
  total_applications: number
  pending_review: number
  approved_loans: number
  active_loans: number
  total_disbursed: number
  overdue_loans: number
  collection_rate: number
}

export interface DashboardOverview {
  activeLoansCount: number
  totalOutstandingBalance: number
  nextRepaymentDate: string | null
  nextRepaymentAmount: number
  statusSummary: {
    active: number
    pending: number
    completed: number
    overdue: number
  }
}

// ===== STATE MACHINE VALIDATION =====

// Valid transitions for ApplicationStatus
export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ['under_review'],
  under_review: ['collateral_required', 'rejected'],
  collateral_required: ['collateral_uploaded'],
  collateral_uploaded: ['collateral_verified', 'collateral_rejected'],
  collateral_verified: ['approved', 'rejected'],
  collateral_rejected: ['collateral_required', 'rejected'],
  approved: ['awaiting_disbursement'],
  rejected: [],
  awaiting_disbursement: ['disbursed'],
  disbursed: [],
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_TRANSITIONS[from]?.includes(to) ?? false
}

export function validateDisbursement(app: { status: ApplicationStatus; collateralStatus?: CollateralStatus }): string | null {
  if (app.status !== 'approved' && app.status !== 'awaiting_disbursement') {
    return 'Application must be approved before disbursement'
  }
  if (app.collateralStatus !== 'verified') {
    return 'Collateral must be verified before disbursement'
  }
  return null
}