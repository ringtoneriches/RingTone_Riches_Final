-- Persist play ticket numbers + result metadata on spin/scratch usage rows.

ALTER TABLE spin_usage ADD COLUMN IF NOT EXISTS ticket_number varchar;
ALTER TABLE spin_usage ADD COLUMN IF NOT EXISTS spin_number integer;
ALTER TABLE spin_usage ADD COLUMN IF NOT EXISTS is_win boolean DEFAULT false;
ALTER TABLE spin_usage ADD COLUMN IF NOT EXISTS segment_id text;
ALTER TABLE spin_usage ADD COLUMN IF NOT EXISTS prize_label text;
ALTER TABLE spin_usage ADD COLUMN IF NOT EXISTS reward_type varchar;
ALTER TABLE spin_usage ADD COLUMN IF NOT EXISTS reward_value text;

ALTER TABLE scratch_card_usage ADD COLUMN IF NOT EXISTS ticket_number varchar;
ALTER TABLE scratch_card_usage ADD COLUMN IF NOT EXISTS card_number integer;
ALTER TABLE scratch_card_usage ADD COLUMN IF NOT EXISTS is_win boolean DEFAULT false;
ALTER TABLE scratch_card_usage ADD COLUMN IF NOT EXISTS prize_id text;
ALTER TABLE scratch_card_usage ADD COLUMN IF NOT EXISTS prize_label text;
ALTER TABLE scratch_card_usage ADD COLUMN IF NOT EXISTS reward_type varchar;
ALTER TABLE scratch_card_usage ADD COLUMN IF NOT EXISTS reward_value text;
