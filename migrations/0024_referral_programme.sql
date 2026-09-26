-- Referral programme: a proper record per referral, plus weekly winners.
--
-- Until now a referral existed only as users.referred_by, and "have we already
-- paid this one?" was answered with
--   WHERE type='referral' AND description LIKE '%<email>%'
-- against a human-readable transaction description. That is fragile in both
-- directions: reword the description and everyone is paid twice; one member's
-- email being a substring of another's blocks a legitimate payment. The unique
-- index on referred_user_id below replaces that guess with a guarantee.
--
-- Additive and idempotent. Existing rows are backfilled at the bottom so the
-- admin view and leaderboard are not empty on day one.

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id varchar NOT NULL REFERENCES users(id),
  referred_user_id varchar NOT NULL REFERENCES users(id),
  referral_code varchar,

  registered_at timestamp NOT NULL DEFAULT now(),
  signup_points_awarded integer DEFAULT 0,

  first_top_up_at timestamp,
  first_top_up_amount numeric(10,2),
  first_top_up_ref varchar,

  reward_points integer DEFAULT 0,
  rewarded_at timestamp,
  reward_transaction_id uuid REFERENCES transactions(id),

  status varchar NOT NULL DEFAULT 'pending',
  risk_reason text,
  risk_signals jsonb DEFAULT '[]'::jsonb,
  reviewed_by varchar REFERENCES users(id),
  reviewed_at timestamp,

  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- A member can only ever be referred once. This is what makes a double
-- payment impossible rather than merely unlikely.
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred_user
  ON referrals (referred_user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON referrals (referrer_id, status);

-- The weekly leaderboard reads rewarded referrals by the date they qualified.
CREATE INDEX IF NOT EXISTS idx_referrals_rewarded_at
  ON referrals (rewarded_at DESC)
  WHERE status = 'rewarded';

CREATE TABLE IF NOT EXISTS referral_weekly_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start varchar NOT NULL,
  user_id varchar NOT NULL REFERENCES users(id),
  referral_count integer NOT NULL,
  prize_points integer NOT NULL,
  transaction_id uuid REFERENCES transactions(id),
  awarded_at timestamp NOT NULL DEFAULT now()
);

-- One prize per member per week, however often the sweep runs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_weekly_winner_unique
  ON referral_weekly_winners (week_start, user_id);

-- Settings, so the numbers can be tuned without a deploy.
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS referrals_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS referral_signup_points integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS referral_reward_points integer DEFAULT 300,
  ADD COLUMN IF NOT EXISTS referral_min_top_up numeric(10,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS referral_weekly_prize_points integer DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS referral_weekly_min_referrals integer DEFAULT 1;

-- Backfill existing referrals. Anyone already marked as referred gets a row;
-- those whose referrer was already paid (a 'referral' transaction naming them)
-- are recorded as rewarded so nobody is paid a second time.
INSERT INTO referrals (referrer_id, referred_user_id, registered_at, status, rewarded_at, reward_points)
SELECT
  u.referred_by,
  u.id,
  COALESCE(u.created_at, now()),
  CASE WHEN t.id IS NOT NULL THEN 'rewarded' ELSE 'pending' END,
  t.created_at,
  CASE WHEN t.id IS NOT NULL THEN 0 ELSE 0 END
FROM users u
LEFT JOIN LATERAL (
  SELECT tr.id, tr.created_at
    FROM transactions tr
   WHERE tr.user_id = u.referred_by
     AND tr.type = 'referral'
     AND tr.description LIKE '%' || u.email || '%'
   ORDER BY tr.created_at
   LIMIT 1
) t ON true
WHERE u.referred_by IS NOT NULL
  AND u.referred_by <> u.id
  AND EXISTS (SELECT 1 FROM users r WHERE r.id = u.referred_by)
ON CONFLICT (referred_user_id) DO NOTHING;
