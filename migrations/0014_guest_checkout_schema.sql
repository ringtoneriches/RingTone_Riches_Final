-- Remaining guest checkout schema not covered by earlier migrations.
-- Safe to re-run on staging/production (IF NOT EXISTS throughout).

-- 0013 may already be applied without prize columns — add them here too.
ALTER TABLE guest_orders
  ADD COLUMN IF NOT EXISTS prize_claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prize_claimed_at timestamp;

ALTER TABLE guest_tickets
  ADD COLUMN IF NOT EXISTS prize_type varchar,
  ADD COLUMN IF NOT EXISTS prize_details jsonb;

CREATE TABLE IF NOT EXISTS guest_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_order_id uuid REFERENCES guest_orders(id),
  ticket_id uuid REFERENCES guest_tickets(id),
  guest_email varchar NOT NULL,
  guest_name varchar NOT NULL,
  guest_phone varchar,
  competition_id uuid NOT NULL,
  prize_amount numeric(10, 2) NOT NULL,
  prize_type varchar NOT NULL,
  prize_details jsonb,
  win_status varchar DEFAULT 'pending',
  claimed_at timestamp,
  transferred_to_user_id uuid,
  transferred_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_prizes_email_idx ON guest_prizes (guest_email);
CREATE INDEX IF NOT EXISTS guest_prizes_status_idx ON guest_prizes (win_status);
CREATE INDEX IF NOT EXISTS guest_prizes_order_idx ON guest_prizes (guest_order_id);

CREATE TABLE IF NOT EXISTS guest_pending_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_order_id uuid REFERENCES guest_orders(id),
  payment_job_reference text NOT NULL,
  payment_reference varchar,
  amount numeric(10, 2) NOT NULL,
  status varchar DEFAULT 'pending',
  metadata jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
