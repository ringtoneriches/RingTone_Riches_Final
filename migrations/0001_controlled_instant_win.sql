-- Controlled instant-win ticket pool
-- Additive only. Existing probability games keep working (instant_win_mode defaults to probability).

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS next_ticket_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS instant_win_mode varchar DEFAULT 'probability';

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS ticket_seq integer,
  ADD COLUMN IF NOT EXISTS prize_type varchar,
  ADD COLUMN IF NOT EXISTS prize_details jsonb,
  ADD COLUMN IF NOT EXISTS result_status varchar DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS instant_win_prize_id uuid;

ALTER TABLE guest_tickets
  ADD COLUMN IF NOT EXISTS ticket_seq integer,
  ADD COLUMN IF NOT EXISTS result_status varchar DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS instant_win_prize_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS tickets_competition_seq_uidx
  ON tickets (competition_id, ticket_seq)
  WHERE ticket_seq IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS guest_tickets_competition_seq_uidx
  ON guest_tickets (competition_id, ticket_seq)
  WHERE ticket_seq IS NOT NULL;

CREATE INDEX IF NOT EXISTS tickets_order_id_idx ON tickets (order_id);
CREATE INDEX IF NOT EXISTS tickets_result_status_idx ON tickets (result_status);
CREATE INDEX IF NOT EXISTS guest_tickets_order_idx ON guest_tickets (guest_order_id);
CREATE INDEX IF NOT EXISTS guest_tickets_result_status_idx ON guest_tickets (result_status);

CREATE TABLE IF NOT EXISTS instant_win_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  value numeric(10, 2) NOT NULL,
  reward_type varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'locked',
  range_from integer NOT NULL,
  range_to integer NOT NULL,
  activation_type varchar NOT NULL DEFAULT 'manual',
  activation_value jsonb,
  allocation_method varchar NOT NULL DEFAULT 'b_on_activate',
  winning_ticket_number integer,
  won_at timestamp,
  winner_user_id varchar,
  winner_display_name varchar,
  last_changed_at timestamp DEFAULT now(),
  last_changed_by varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instant_win_prizes_competition_idx ON instant_win_prizes (competition_id);
CREATE INDEX IF NOT EXISTS instant_win_prizes_status_idx ON instant_win_prizes (status);
CREATE INDEX IF NOT EXISTS instant_win_prizes_winning_ticket_idx ON instant_win_prizes (competition_id, winning_ticket_number);

CREATE TABLE IF NOT EXISTS instant_win_prize_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id uuid NOT NULL REFERENCES instant_win_prizes(id) ON DELETE CASCADE,
  admin_id varchar,
  action varchar NOT NULL,
  previous_status varchar,
  new_status varchar,
  activation_rule jsonb,
  rng_ref varchar,
  winning_ticket_number integer,
  reason text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instant_win_prize_audit_prize_idx ON instant_win_prize_audit (prize_id);
CREATE INDEX IF NOT EXISTS instant_win_prize_audit_created_idx ON instant_win_prize_audit (created_at);
