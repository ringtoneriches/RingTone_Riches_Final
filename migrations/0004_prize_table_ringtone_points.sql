-- Optional Ringtone points on Prize Table rows.
-- Additive. Existing prizes default to 0 and keep working.

ALTER TABLE competition_prizes
  ADD COLUMN IF NOT EXISTS ringtone_points integer NOT NULL DEFAULT 0;
