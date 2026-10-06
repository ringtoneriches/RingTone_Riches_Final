-- Say "Golden Ticket" on the winners wall.
--
-- 0029 put Golden Ticket wins on the wall using the campaign name alone. But
-- admins name campaigns after the prize -- "£50 Cash", "£30 Takeaway Spend" --
-- so four of the five read exactly like an ordinary game win, which defeats
-- the point of putting them there. The name is kept, because it is what the
-- player was told they had won, and the label goes in front of it.
--
-- 0029 is left untouched: it is already applied, the runner tracks it by
-- checksum, and editing an applied migration would make it fail.
--
-- Idempotent through the WHERE: a row is only rewritten while its description
-- is still exactly the bare campaign name, which stops being true the moment
-- this runs. A campaign already named after the ticket is skipped rather than
-- made to stutter ("Golden Ticket — £10 Golden Ticket").
--
-- This mirrors winnerPrizeDescription() in services/golden-ticket-winner.ts,
-- which labels every win from here on; the tests there are the specification.

UPDATE winners w
SET prize_description = 'Golden Ticket — ' || TRIM(g.prize_name),
    updated_at = NOW()
FROM golden_ticket_wins g
WHERE g.user_id = w.user_id
  AND g.awarded_at = w.created_at
  AND TRIM(g.prize_name) <> ''
  AND g.prize_name !~* 'golden[[:space:]]*ticket'
  AND w.prize_description = TRIM(g.prize_name);
