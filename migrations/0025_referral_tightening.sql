-- Referral tightening, from the owner's review before go-live.
--
-- 1. A referral can now be reversed. The status column is a plain varchar with
--    no CHECK constraint, so nothing needs altering for the new value; this
--    note records that "reversed" joins the set.
--
-- 2. The weekly Top Recruiter prize now needs at least three qualifying
--    referrals. Without a floor, a quiet week pays £15 for a single referral.
--    The default is changed for new rows and the existing settings row is
--    updated, otherwise the environments already running keep the old 1.

ALTER TABLE platform_settings
  ALTER COLUMN referral_weekly_min_referrals SET DEFAULT 3;

UPDATE platform_settings
   SET referral_weekly_min_referrals = 3
 WHERE referral_weekly_min_referrals IS NULL
    OR referral_weekly_min_referrals < 3;

-- The leaderboard reads rewarded referrals by the moment they qualified, and
-- the tie-break compares those moments, so keep that lookup cheap.
CREATE INDEX IF NOT EXISTS idx_referrals_week_leaderboard
  ON referrals (referrer_id, rewarded_at)
  WHERE status IN ('rewarded', 'flagged');
