-- Persist play ticket numbers on game usage / result rows.

ALTER TABLE slot_usage ADD COLUMN IF NOT EXISTS ticket_number varchar;
ALTER TABLE royal_usage ADD COLUMN IF NOT EXISTS ticket_number varchar;
ALTER TABLE pop_wins ADD COLUMN IF NOT EXISTS ticket_number varchar;
ALTER TABLE voltz_wins ADD COLUMN IF NOT EXISTS ticket_number varchar;
ALTER TABLE plinko_wins ADD COLUMN IF NOT EXISTS ticket_number varchar;
