-- Discount codes were being spent when someone typed them into the checkout
-- box, not when they paid. Nothing gave the use back if they walked away, so a
-- code with four "uses" had been paid for once, and a code that reached its
-- limit on unpaid checkouts switched itself off for everybody.
--
-- The application now counts a use by looking at the order the code was put
-- on, so there is no counter to keep in step. This migration makes the
-- existing data agree with that, and undoes the damage already done.

-- The counting queries join usages to orders; without these they are seq scans
-- over the whole table on every checkout.
CREATE INDEX IF NOT EXISTS idx_discount_code_usages_code
  ON discount_code_usages (discount_code_id);

CREATE INDEX IF NOT EXISTS idx_discount_code_usages_order
  ON discount_code_usages (order_id);

-- Put uses_count back to what was actually paid for. The column is now only a
-- record of the past -- the application derives the live figure -- but leaving
-- it overstated would mislead anyone reading the table directly.
--
-- A usage row with no order at all predates order-backed counting, so it is
-- left counted rather than guessed away.
UPDATE discount_codes c
SET uses_count = (
  SELECT COUNT(*)
  FROM discount_code_usages u
  LEFT JOIN orders o ON o.id = u.order_id
  WHERE u.discount_code_id = c.id
    AND (o.status = 'completed' OR u.order_id IS NULL)
),
updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM discount_code_usages u WHERE u.discount_code_id = c.id
);

-- Switch codes back on where the only thing that closed them was checkouts
-- nobody paid for.
--
-- Deliberately narrow: a code is touched only when it is inactive, its paid
-- uses (as corrected above) are under the limit, and at least one unpaid
-- application exists to explain why it closed. A code with no unpaid
-- applications behind it is left alone.
--
-- This cannot tell an auto-closed code from one an admin switched off by hand
-- that happens to have an abandoned checkout against it. That combination is
-- worth a look after deploying; the alternative is leaving live codes dead.
UPDATE discount_codes c
SET is_active = true,
    updated_at = NOW()
WHERE c.is_active = false
  AND c.max_uses IS NOT NULL
  AND c.uses_count < c.max_uses
  AND EXISTS (
    SELECT 1
    FROM discount_code_usages u
    LEFT JOIN orders o ON o.id = u.order_id
    WHERE u.discount_code_id = c.id
      AND u.order_id IS NOT NULL
      AND (o.status IS NULL OR o.status <> 'completed')
  );
