-- WealthPlanrAI — Migration 010
-- Referral system: discount codes, referrals, commission tracking

-- Discount codes (created by admin only)
CREATE TABLE IF NOT EXISTS discount_codes (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  text UNIQUE NOT NULL,
  description           text,

  discount_type         text NOT NULL DEFAULT 'percentage',
  discount_value        numeric(10,2) NOT NULL,

  referrer_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  commission_percentage numeric(5,2) NOT NULL DEFAULT 0,

  max_uses              integer,
  current_uses          integer DEFAULT 0,
  expires_at            timestamptz,
  is_active             boolean DEFAULT true,

  created_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Referrals (one row per referred advisor)
CREATE TABLE IF NOT EXISTS referrals (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  referrer_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_code_id        uuid REFERENCES discount_codes(id) ON DELETE SET NULL,
  discount_code           text,

  original_price          numeric(10,2) NOT NULL,
  discount_type           text NOT NULL,
  discount_value          numeric(10,2) NOT NULL,
  discounted_price        numeric(10,2) NOT NULL,
  commission_percentage   numeric(5,2) NOT NULL,

  plan                    text NOT NULL,
  status                  text DEFAULT 'active',

  total_revenue_generated numeric(10,2) DEFAULT 0,
  total_commission_earned numeric(10,2) DEFAULT 0,
  total_commission_paid   numeric(10,2) DEFAULT 0,

  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- Commission payments log (one row per month per referral)
CREATE TABLE IF NOT EXISTS commission_payments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id       uuid REFERENCES referrals(id) ON DELETE CASCADE,
  referrer_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  period_month      integer NOT NULL,
  period_year       integer NOT NULL,

  referred_payment  numeric(10,2) NOT NULL,
  commission_rate   numeric(5,2) NOT NULL,
  commission_amount numeric(10,2) NOT NULL,

  status            text DEFAULT 'pending',
  paid_at           timestamptz,
  payment_method    text,
  payment_reference text,
  notes             text,

  created_at        timestamptz DEFAULT now()
);

-- Add referral fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code             text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code          text,
  ADD COLUMN IF NOT EXISTS discount_applied_percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS actual_monthly_payment    numeric(10,2);

-- RLS
ALTER TABLE discount_codes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_read_active_codes"   ON discount_codes;
DROP POLICY IF EXISTS "referrer_sees_own_referrals"    ON referrals;
DROP POLICY IF EXISTS "referrer_sees_own_commissions"  ON commission_payments;

CREATE POLICY "anyone_can_read_active_codes" ON discount_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "referrer_sees_own_referrals" ON referrals
  FOR SELECT USING (referrer_id = auth.uid());

CREATE POLICY "referrer_sees_own_commissions" ON commission_payments
  FOR SELECT USING (referrer_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code   ON discount_codes (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_referrals_referrer     ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred     ON referrals (referred_id);
CREATE INDEX IF NOT EXISTS idx_commission_referral    ON commission_payments (referral_id);
CREATE INDEX IF NOT EXISTS idx_commission_status      ON commission_payments (status);
