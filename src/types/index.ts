// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  firm_name: string | null
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  created_at: string
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive'

export type InvestmentGoal =
  | 'retirement'
  | 'wealth_growth'
  | 'income'
  | 'preservation'
  | 'education'

export interface AssessmentAnswers {
  full_name: string
  age: number
  annual_income: number
  investable_assets: number
  investment_horizon: number       // years
  goal: InvestmentGoal
  risk_tolerance: 1 | 2 | 3 | 4 | 5
  has_emergency_fund: boolean
  existing_debt: boolean
}

export interface AssessmentResult {
  id: string
  user_id: string | null
  answers: AssessmentAnswers
  risk_profile: RiskProfile
  score: number                    // 0–100
  recommended_allocation: Allocation
  created_at: string
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface Allocation {
  us_equities: number
  intl_equities: number
  fixed_income: number
  alternatives: number
  cash: number
}

export interface Client {
  id: string
  firm_id: string
  full_name: string
  email: string | null
  risk_profile: RiskProfile
  aum_dollars: number
  last_review: string | null
  created_at: string
}

export interface DashboardStats {
  total_aum: number
  client_count: number
  avg_return_ytd: number
  compliance_score: number
  reviews_due: number
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise'

export interface NavItem {
  label: string
  href: string
  icon?: string
}
