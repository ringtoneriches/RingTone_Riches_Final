-- Pre-selected quantity on homepage / listing cards. Admin-controlled. Does not change ticket or payment logic.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS default_quantity integer NOT NULL DEFAULT 1;
