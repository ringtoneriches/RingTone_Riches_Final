-- The winner cards show prize, winner and date. The owner wants the winning
-- ticket number and the exact time on them too, so a screenshot shared on
-- Facebook carries the whole story.
--
-- The time needed nothing: winners.created_at has always been a full
-- timestamp and every existing row has a real one. Only the ticket number is
-- new.
--
-- Nullable on purpose and not backfilled. Ticket numbers live in the per-game
-- tables and were never copied onto the winner row, so historic winners cannot
-- be matched back to their play with any confidence -- pairing them by user and
-- timestamp matched under 6%. Winners from here on record it; older cards just
-- leave the line out.
ALTER TABLE winners
  ADD COLUMN IF NOT EXISTS winning_ticket_number varchar;
