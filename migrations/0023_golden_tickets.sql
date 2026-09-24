-- Golden Tickets: a promotional prize layer above the games.
--
-- A play gets its normal result first; a Golden Ticket may then drop on top,
-- unrelated to the competition's own prize pool. The draw is committed before
-- anyone plays: on activation the system seals the winning play positions into
-- drop_positions, so nobody can decide afterwards who receives a ticket.

CREATE TABLE IF NOT EXISTS golden_ticket_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prize_type varchar NOT NULL,
  prize_value numeric(10,2),
  prize_description text,
  prize_image_url text,

  eligible_game_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  eligible_competition_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  min_spend numeric(10,2),
  include_free_plays boolean NOT NULL DEFAULT false,

  ticket_count integer NOT NULL,
  drop_window integer NOT NULL,
  drop_positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  plays_seen integer NOT NULL DEFAULT 0,
  tickets_awarded integer NOT NULL DEFAULT 0,

  status varchar NOT NULL DEFAULT 'draft',
  starts_at timestamp,
  ends_at timestamp,

  created_by varchar NOT NULL REFERENCES users(id),
  activated_by varchar REFERENCES users(id),
  activated_at timestamp,
  closed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS golden_ticket_wins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES golden_ticket_campaigns(id),
  user_id varchar NOT NULL REFERENCES users(id),
  competition_id uuid REFERENCES competitions(id),
  game_type varchar NOT NULL,
  play_id varchar,
  order_id uuid REFERENCES orders(id),
  original_result text,
  drop_position integer NOT NULL,

  prize_type varchar NOT NULL,
  prize_name text NOT NULL,
  prize_value numeric(10,2),

  transaction_id uuid REFERENCES transactions(id),
  fulfilment_status varchar NOT NULL,
  fulfilment_note text,
  awarded_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- A sealed position can only ever pay out once. This is what makes double
-- awarding impossible at the database level rather than only in code.
CREATE UNIQUE INDEX IF NOT EXISTS idx_golden_ticket_wins_unique_position
  ON golden_ticket_wins (campaign_id, drop_position);

CREATE INDEX IF NOT EXISTS idx_golden_ticket_wins_user
  ON golden_ticket_wins (user_id, awarded_at DESC);

-- Only live campaigns are consulted on the play path, so keep that lookup cheap.
CREATE INDEX IF NOT EXISTS idx_golden_ticket_campaigns_active
  ON golden_ticket_campaigns (status, starts_at, ends_at)
  WHERE status IN ('active', 'scheduled');
