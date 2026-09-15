-- Smoke test for the automated migration runner (see scripts/migrate.mjs, PR #98).
--
-- Purpose: prove that a NEW migration is picked up and applied automatically on
-- deploy. Baselining an existing database only exercises the "record, don't run"
-- path; this exercises the path that actually matters.
--
-- Numbered 9999 on purpose so it can never collide with the real sequence: the
-- runner records a migration by its version number, so if this were 0016 and we
-- later deleted it, a real 0016 would be silently skipped as "already applied".
--
-- Safe to remove once verified. It creates one standalone table and touches
-- nothing else. Idempotent, like every other migration here.

CREATE TABLE IF NOT EXISTS _migration_runner_smoke_test (
  id         integer PRIMARY KEY,
  note       text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO _migration_runner_smoke_test (id, note)
VALUES (1, 'applied automatically by scripts/migrate.mjs during pre-deploy')
ON CONFLICT (id) DO NOTHING;
