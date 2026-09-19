-- Per-competition cap on how many tickets one account may hold, counted
-- cumulatively across all their orders. Additive only.
--
-- Added after a 100%-off sale on a physical-prize competition was taken 13
-- times over by a single account: the intended limit existed only in the
-- competition's title ("MAX 2 FREE PER USER"), with nothing enforcing it.
--
-- NULL or 0 means no limit, which is the existing behaviour for every
-- competition that already exists.
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS max_tickets_per_user integer;

-- The cap is checked on every purchase, so counting a user's tickets for a
-- competition has to be cheap.
CREATE INDEX IF NOT EXISTS tickets_competition_user_idx
  ON tickets (competition_id, user_id);
