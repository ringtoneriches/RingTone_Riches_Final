-- Winner's Circle: mark the curated cheque-presentation winners.
--
-- Every instant win auto-creates a `winners` row with is_showcase defaulting
-- to true and image_url set to the competition artwork, so neither field can
-- tell a "£1,000 cheque on the doorstep" photo from a "100 Points" record.
-- This flag draws that line. It defaults to false, so existing rows keep out
-- of the homepage section until an admin opts them in.

ALTER TABLE winners
  ADD COLUMN IF NOT EXISTS is_circle boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_winners_circle
  ON winners (is_circle, created_at DESC)
  WHERE is_circle = true;
