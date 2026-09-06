-- Admin-editable card badge (top-left game label).
-- Additive. Existing rows stay null and keep the hardcoded type default.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS badge_label varchar(40);
