-- Guest checkout flag on users.
-- Additive only. Existing rows stay as they are and default to false (normal accounts).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_guest_account boolean DEFAULT false;
