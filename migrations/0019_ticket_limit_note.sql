-- Wording shown to customers when a competition caps tickets per person.
--
-- Optional: when empty, the site generates a sentence from
-- max_tickets_per_user (see services/ticket-limits.ts). This column is only
-- for when an admin wants to say something more specific, e.g. explaining a
-- free giveaway's terms.
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS ticket_limit_note text;
