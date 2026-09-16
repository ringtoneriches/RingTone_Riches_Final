-- Free Daily Spin: one free spin per registered member per UK day, paying
-- Ringtone Points out of a fixed pool. Additive only.

-- Global on/off, alongside the other platform toggles.
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS daily_spin_enabled boolean DEFAULT false;

-- One pool/cycle. Runs until its prizes are exhausted, then a new one starts.
CREATE TABLE IF NOT EXISTS daily_spin_cycles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar,
  status        varchar NOT NULL DEFAULT 'draft',
  activated_at  timestamp,
  exhausted_at  timestamp,
  created_by    varchar,
  notes         text,
  created_at    timestamp DEFAULT now(),
  updated_at    timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_spin_cycles_status_idx
  ON daily_spin_cycles (status);

-- Prize tiers inside a cycle. `remaining` is decremented as prizes go out;
-- `segment_index` pins each tier to one of the wheel's 8 segments.
CREATE TABLE IF NOT EXISTS daily_spin_prizes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id      uuid NOT NULL REFERENCES daily_spin_cycles(id) ON DELETE CASCADE,
  points_value  integer NOT NULL,
  quantity      integer NOT NULL,
  remaining     integer NOT NULL,
  segment_index integer NOT NULL,
  created_at    timestamp DEFAULT now(),
  updated_at    timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_spin_prizes_cycle_idx
  ON daily_spin_prizes (cycle_id);

-- One tier per wheel segment within a cycle.
CREATE UNIQUE INDEX IF NOT EXISTS daily_spin_prizes_cycle_segment_idx
  ON daily_spin_prizes (cycle_id, segment_index);

-- One row per spin.
CREATE TABLE IF NOT EXISTS daily_spin_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id       uuid NOT NULL REFERENCES daily_spin_cycles(id),
  prize_id       uuid NOT NULL REFERENCES daily_spin_prizes(id),
  user_id        varchar NOT NULL REFERENCES users(id),
  points_awarded integer NOT NULL,
  segment_index  integer NOT NULL,
  spin_date      date NOT NULL,
  created_at     timestamp DEFAULT now()
);

-- THIS IS THE DAILY LOCK. The insert either succeeds or the member has already
-- spun today. Enforced by the database, so a refresh, a second device or a
-- double tap cannot produce two spins in one UK day. Do not drop this index
-- and rely on an application-level check instead: that leaves a race window.
CREATE UNIQUE INDEX IF NOT EXISTS daily_spin_results_user_day_idx
  ON daily_spin_results (user_id, spin_date);

CREATE INDEX IF NOT EXISTS daily_spin_results_cycle_idx
  ON daily_spin_results (cycle_id);

CREATE INDEX IF NOT EXISTS daily_spin_results_created_idx
  ON daily_spin_results (created_at);
