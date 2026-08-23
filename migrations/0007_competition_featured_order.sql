-- Homepage featured slider order. Null = not featured. Lower number = earlier slide.
-- Does not change listing display_order or purchase/ticket logic.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS featured_order integer;
