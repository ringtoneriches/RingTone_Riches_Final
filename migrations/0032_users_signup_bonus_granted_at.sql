-- Record when an account was paid the signup bonus.
--
-- The bonus used to be credited at registration with no check at all, and left
-- no mark on the account -- so nothing could ask whether an account had
-- already had one, or how many had gone to a single address. One person took
-- it repeatedly from one handset under invented names and inboxes they did not
-- own.
--
-- Two things are built on this column:
--   * granting is idempotent -- a replayed verification cannot pay twice;
--   * bonuses paid to accounts registered from one address inside a rolling
--     window can be counted, which is the cap in signup-bonus-guard.ts.
--
-- Note that `users` has no IP column of its own -- `users.ipAddress` is passed
-- to createUser at registration and silently dropped, since nothing by that
-- name exists on the table. The registration address lives in `user_ip_logs`,
-- which is written on the same request, so the count joins through there. That
-- table had no index on the address, only on user_id, so one is added here.
--
-- Nothing is backfilled. Existing accounts stay NULL, which reads as "never
-- paid" -- correct for the count, and harmless for idempotency, since every one
-- of them was already paid at registration under the old flow and cannot reach
-- verification again (they are all marked verified already).

ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_bonus_granted_at timestamp;

CREATE INDEX IF NOT EXISTS users_signup_bonus_granted_at_idx
  ON users (signup_bonus_granted_at)
  WHERE signup_bonus_granted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_ip_logs_ip_address_idx
  ON user_ip_logs (ip_address);
