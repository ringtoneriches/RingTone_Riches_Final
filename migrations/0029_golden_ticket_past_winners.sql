-- Put Golden Ticket winners on the public Past Winners wall.
--
-- Every game records its winners into `winners`, but a Golden Ticket is handed
-- out by Ringtone Riches rather than won from a game, so nothing ever recorded
-- one. New wins are written by the award path from here on; this backfills the
-- ones that already happened.
--
-- Idempotent by the NOT EXISTS below rather than by a unique index: `winners`
-- has no natural key to add one on, and it legitimately holds many rows per
-- user and competition. Matching on user, timestamp and description is exact
-- here because the award path writes `created_at` from the win's `awarded_at`.
--
-- prize_value carries a "£" for cash and credit because the winners page reads
-- cash-vs-points out of that string -- "50.00" with no symbol shows as
-- "50 Points" on the card. A physical prize has no public cash value, so its
-- name is used instead. This mirrors services/golden-ticket-winner.ts; the
-- tests there are the specification.

INSERT INTO winners (
  user_id,
  competition_id,
  prize_description,
  prize_value,
  image_url,
  is_showcase,
  is_circle,
  created_at,
  updated_at
)
SELECT
  w.user_id,
  w.competition_id,
  COALESCE(NULLIF(TRIM(w.prize_name), ''), 'Golden Ticket'),
  CASE
    WHEN w.prize_type IN ('cash', 'credit')
     AND w.prize_value IS NOT NULL
     AND w.prize_value > 0
    THEN '£' || CASE
           WHEN w.prize_value = TRUNC(w.prize_value)
           THEN TO_CHAR(w.prize_value, 'FM9999999990')
           ELSE TO_CHAR(w.prize_value, 'FM9999999990.00')
         END
    ELSE COALESCE(NULLIF(TRIM(w.prize_name), ''), 'Golden Ticket')
  END,
  c.prize_image_url,
  TRUE,   -- showcase: these belong on the public wall
  FALSE,  -- not a Winner's Circle cheque photo
  w.awarded_at,
  NOW()
FROM golden_ticket_wins w
LEFT JOIN golden_ticket_campaigns c ON c.id = w.campaign_id
WHERE w.fulfilment_status <> 'cancelled'
  AND NOT EXISTS (
    SELECT 1 FROM winners x
    WHERE x.user_id = w.user_id
      AND x.created_at = w.awarded_at
      AND x.prize_description = COALESCE(NULLIF(TRIM(w.prize_name), ''), 'Golden Ticket')
  );
