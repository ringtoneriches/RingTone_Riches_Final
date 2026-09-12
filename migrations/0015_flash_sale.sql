-- Flash sale pricing per competition.
-- Additive only: existing rows keep NULLs, which means "no sale" and the normal price applies.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS flash_sale_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS flash_sale_starts_at timestamp,
  ADD COLUMN IF NOT EXISTS flash_sale_ends_at timestamp;

CREATE INDEX IF NOT EXISTS competitions_flash_sale_ends_idx ON competitions (flash_sale_ends_at);
