-- Run in pgAdmin against staging OR production.
-- Returns rows only for MISSING items. Empty result = all checked migrations applied.

WITH expected AS (
  SELECT * FROM (VALUES
    -- 0001 competitions
    ('competitions', 'next_ticket_number'),
    ('competitions', 'instant_win_mode'),
    -- 0001 tickets
    ('tickets', 'ticket_seq'),
    ('tickets', 'prize_type'),
    ('tickets', 'prize_details'),
    ('tickets', 'result_status'),
    ('tickets', 'instant_win_prize_id'),
    -- 0001 guest_tickets
    ('guest_tickets', 'ticket_seq'),
    ('guest_tickets', 'result_status'),
    ('guest_tickets', 'instant_win_prize_id'),
    -- 0002
    ('competitions', 'ticket_block_size'),
    -- 0003 (instant_win_prizes.competition_prize_id checked below as column)
    ('instant_win_prizes', 'competition_prize_id'),
    -- 0004
    ('competition_prizes', 'ringtone_points'),
    -- 0005-0010 competitions
    ('competitions', 'prize_amount'),
    ('competitions', 'badge_label'),
    ('competitions', 'featured_order'),
    ('competitions', 'default_quantity'),
    ('competitions', 'featured_image_url'),
    ('competitions', 'card_image_url'),
    ('competitions', 'page_image_url'),
    -- 0009
    ('users', 'is_guest_account'),
    -- 0011
    ('slot_usage', 'ticket_number'),
    ('royal_usage', 'ticket_number'),
    ('pop_wins', 'ticket_number'),
    ('voltz_wins', 'ticket_number'),
    ('plinko_wins', 'ticket_number'),
    -- 0012 spin_usage
    ('spin_usage', 'ticket_number'),
    ('spin_usage', 'spin_number'),
    ('spin_usage', 'is_win'),
    ('spin_usage', 'segment_id'),
    ('spin_usage', 'prize_label'),
    ('spin_usage', 'reward_type'),
    ('spin_usage', 'reward_value'),
    -- 0012 scratch_card_usage
    ('scratch_card_usage', 'ticket_number'),
    ('scratch_card_usage', 'card_number'),
    ('scratch_card_usage', 'is_win'),
    ('scratch_card_usage', 'prize_id'),
    ('scratch_card_usage', 'prize_label'),
    ('scratch_card_usage', 'reward_type'),
    ('scratch_card_usage', 'reward_value'),
    -- 0013 guest_orders
    ('guest_orders', 'user_id'),
    ('guest_orders', 'first_name'),
    ('guest_orders', 'last_name'),
    ('guest_orders', 'prize_claimed'),
    ('guest_orders', 'prize_claimed_at'),
    -- 0014 guest_tickets
    ('guest_tickets', 'prize_type'),
    ('guest_tickets', 'prize_details')
  ) AS t(table_name, column_name)
),
expected_tables AS (
  SELECT * FROM (VALUES
    ('instant_win_prizes'),
    ('instant_win_prize_audit'),
    ('guest_prizes'),
    ('guest_pending_payments')
  ) AS t(table_name)
),
cols AS (
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
),
tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
)
SELECT 'MISSING COLUMN' AS issue, e.table_name, e.column_name, NULL AS migration_hint
FROM expected e
LEFT JOIN cols c ON c.table_name = e.table_name AND c.column_name = e.column_name
WHERE c.column_name IS NULL

UNION ALL

SELECT 'MISSING TABLE' AS issue, et.table_name, NULL, CASE et.table_name
  WHEN 'instant_win_prizes' THEN '0001'
  WHEN 'instant_win_prize_audit' THEN '0001'
  WHEN 'guest_prizes' THEN '0014'
  WHEN 'guest_pending_payments' THEN '0014'
END
FROM expected_tables et
LEFT JOIN tables t ON t.table_name = et.table_name
WHERE t.table_name IS NULL

ORDER BY issue, table_name, column_name;
