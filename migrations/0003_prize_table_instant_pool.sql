-- Link Instant Pool rows to Prize Table entries (controlled games only).
-- Additive. Existing prizes stay ungrouped and keep working.

ALTER TABLE instant_win_prizes
  ADD COLUMN IF NOT EXISTS competition_prize_id uuid REFERENCES competition_prizes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS instant_win_prizes_table_prize_idx
  ON instant_win_prizes (competition_prize_id);
