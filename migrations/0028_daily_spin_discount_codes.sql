-- The daily spin pays Ringtone Points. The owner wants it to hand out discount
-- codes instead: a code gives someone a reason to come back and spend, while
-- still having to top up to use it.
--
-- A code has always been a shared string -- anyone who knows it can type it.
-- That is fine for a campaign but wrong for a prize, because the first
-- screenshot in the group chat gives it to everybody. So a code can now belong
-- to one person, and the spin mints one of those per win.

ALTER TABLE discount_codes
  -- Null means shared, which is what every existing code is.
  ADD COLUMN IF NOT EXISTS assigned_user_id varchar REFERENCES users(id),
  -- A percentage comes off the basket total, so half off a £60 basket is £30.
  -- Null means uncapped, again matching every code that exists today.
  ADD COLUMN IF NOT EXISTS max_discount_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS source varchar DEFAULT 'admin';

CREATE INDEX IF NOT EXISTS idx_discount_codes_assigned_user
  ON discount_codes (assigned_user_id)
  WHERE assigned_user_id IS NOT NULL;

-- A slice of the wheel can now pay a discount instead of points. Defaulting to
-- points means every existing cycle keeps paying exactly what it paid before.
ALTER TABLE daily_spin_prizes
  ADD COLUMN IF NOT EXISTS reward_kind varchar NOT NULL DEFAULT 'points',
  ADD COLUMN IF NOT EXISTS discount_type varchar,
  ADD COLUMN IF NOT EXISTS discount_value numeric(10,2),
  ADD COLUMN IF NOT EXISTS discount_max_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS discount_hours integer DEFAULT 48;

ALTER TABLE daily_spin_results
  ADD COLUMN IF NOT EXISTS discount_code_id uuid REFERENCES discount_codes(id);
