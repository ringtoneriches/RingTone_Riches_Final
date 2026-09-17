-- Free Daily Spin: abuse controls. Additive only.

-- Record where each spin came from, so farming across many accounts is visible
-- and can be capped.
ALTER TABLE daily_spin_results
  ADD COLUMN IF NOT EXISTS ip_address varchar;

-- Supports the per-IP daily cap lookup.
CREATE INDEX IF NOT EXISTS daily_spin_results_ip_day_idx
  ON daily_spin_results (ip_address, spin_date);

-- How many spins one IP may take per UK day. 0 disables the cap.
--
-- Deliberately generous by default: UK mobile networks use CGNAT, so hundreds
-- of unrelated customers can share a single IP. A tight cap would silently
-- refuse real members with no way to explain it, which is worse than the
-- farming it prevents. Tighten only if abuse actually shows up in the history.
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS daily_spin_ip_limit integer DEFAULT 12;
