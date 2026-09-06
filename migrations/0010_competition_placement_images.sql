-- Per-placement competition pictures. Optional. image_url remains the fallback
-- for wallet, orders, sharing, and any slot that has no dedicated picture.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS card_image_url text,
  ADD COLUMN IF NOT EXISTS page_image_url text;
