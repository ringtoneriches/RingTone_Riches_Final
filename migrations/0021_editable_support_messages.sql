-- Let admins correct a support reply after sending it.
--
-- Numbered 0021 rather than 0020 on purpose. schema_migrations uses the
-- numeric prefix as its PRIMARY KEY, and 0020 is already taken by
-- 0020_seasonal_theme.sql on dev. Two files sharing a version collide the
-- moment both branches reach the same database.
--
-- All three columns are nullable with no default, so every message already in
-- the table reads as "never edited" and nothing existing changes.

ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS edited_by VARCHAR,
  ADD COLUMN IF NOT EXISTS original_message TEXT;

-- Finding a ticket's edited messages should not scan the table.
CREATE INDEX IF NOT EXISTS support_messages_edited_at_idx
  ON support_messages (edited_at)
  WHERE edited_at IS NOT NULL;
