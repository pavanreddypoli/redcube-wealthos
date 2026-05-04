-- Track founding member count
CREATE TABLE IF NOT EXISTS founding_member_config (
  id                    integer PRIMARY KEY DEFAULT 1,
  total_slots           integer DEFAULT 500,
  claimed_slots         integer DEFAULT 0,
  is_active             boolean DEFAULT true,
  offer_ends_at         timestamptz,
  price_founding        numeric(10,2) DEFAULT 2.90,
  price_regular         numeric(10,2) DEFAULT 29.00,
  next_tier_price       numeric(10,2) DEFAULT 14.90,
  next_tier_limit       integer DEFAULT 1000,
  created_at            timestamptz DEFAULT now()
);

-- Insert initial config (only one row, id=1)
INSERT INTO founding_member_config (
  id,
  total_slots,
  claimed_slots,
  is_active,
  offer_ends_at,
  price_founding,
  price_regular
) VALUES (
  1,
  500,
  0,
  true,
  NOW() + INTERVAL '60 days',
  2.90,
  29.00
) ON CONFLICT (id) DO NOTHING;

-- Add consumer fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'consumer'
    CHECK (user_type IN ('consumer', 'advisor', 'planner', 'admin')),
  ADD COLUMN IF NOT EXISTS consumer_plan text DEFAULT 'free'
    CHECK (consumer_plan IN ('free', 'premium')),
  ADD COLUMN IF NOT EXISTS is_founding_member boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_member_number integer,
  ADD COLUMN IF NOT EXISTS consumer_stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS consumer_subscription_id text,
  ADD COLUMN IF NOT EXISTS consumer_subscription_status text DEFAULT 'inactive';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_consumer_plan ON profiles(consumer_plan);

-- Atomic function to claim founding member slot
CREATE OR REPLACE FUNCTION claim_founding_member_slot(user_id uuid)
RETURNS integer AS $$
DECLARE
  slot_number integer;
  current_count integer;
  total integer;
BEGIN
  SELECT claimed_slots, total_slots
  INTO current_count, total
  FROM founding_member_config
  WHERE id = 1
  FOR UPDATE;

  IF current_count >= total THEN
    RETURN -1;
  END IF;

  UPDATE founding_member_config
  SET claimed_slots = claimed_slots + 1
  WHERE id = 1
  RETURNING claimed_slots INTO slot_number;

  UPDATE profiles
  SET
    is_founding_member = true,
    founding_member_number = slot_number,
    consumer_plan = 'premium'
  WHERE id = user_id;

  RETURN slot_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
