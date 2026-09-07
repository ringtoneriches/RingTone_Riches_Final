-- Guest checkout: link orders to registered users and store split name fields.
-- Additive only. Existing guest_orders rows are backfilled from guest_name where needed.

ALTER TABLE guest_orders
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS first_name varchar,
  ADD COLUMN IF NOT EXISTS last_name varchar,
  ADD COLUMN IF NOT EXISTS prize_claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prize_claimed_at timestamp;

UPDATE guest_orders
SET
  first_name = COALESCE(
    NULLIF(trim(first_name), ''),
    NULLIF(split_part(guest_name, ' ', 1), ''),
    'Guest'
  ),
  last_name = COALESCE(
    NULLIF(trim(last_name), ''),
    NULLIF(trim(substring(guest_name from position(' ' in guest_name))), ''),
    'User'
  )
WHERE first_name IS NULL
   OR last_name IS NULL
   OR trim(first_name) = ''
   OR trim(last_name) = '';

CREATE INDEX IF NOT EXISTS guest_orders_user_idx ON guest_orders (user_id);
