-- Configurable sale-block size for controlled pool competitions.
-- NULL = keep issuing 1, 2, 3 in order (existing behaviour).
-- e.g. 500 on a 10,000-ticket game = random unused numbers in 1-500, then 501-1000, etc.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS ticket_block_size integer;
