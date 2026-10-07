-- Make the duplicate-phone lookup at signup cheap.
--
-- Registration now refuses a phone number that an existing account already
-- uses. Numbers are compared on their last nine digits, because the signup
-- field accepts '+', spaces, dashes and brackets, so one line can be stored as
-- '07359126899' or '+44 7359 126899' and a plain string comparison would miss
-- the match -- and could be walked past on purpose by typing the other form.
--
-- The expression here is the one in PHONE_MATCH_KEY_SQL
-- (server/services/phone-identity.ts). The lookup has to spell it identically
-- or Postgres will not use this index and every signup becomes a seq scan of
-- users. A test pins the string so the two cannot drift apart.
--
-- Deliberately NOT unique. Production already holds duplicates -- three
-- accounts share 07359126899 and two more share 07359126898 -- so a unique
-- index would fail to build, and because migrations run as a pre-deploy step
-- that failure would abort the deploy rather than just skipping the index.
-- Existing accounts are left alone; the rule applies to new signups and to
-- changes of number, where it is enforced in the application.
--
-- REGEXP_REPLACE and RIGHT are both IMMUTABLE, so they are indexable.

CREATE INDEX IF NOT EXISTS users_phone_match_key_idx
  ON users (RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 9))
  WHERE phone_number IS NOT NULL AND phone_number <> '';
