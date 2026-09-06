-- Headline "Win up to" amount on competitions (card display).
-- Additive. Existing rows stay null and keep using a £ amount in the title.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS prize_amount numeric(10, 2);
