#!/usr/bin/env node
/**
 * Find payments Cashflows collected that we never credited.
 *
 * One payment job can hold several attempts. A customer who fails 3D Secure
 * and retries successfully produces two: the first marks our row "failed",
 * the second pays. Until this was fixed the second one was discarded, so the
 * money was taken and nothing was credited.
 *
 * This walks rows we consider failed, asks Cashflows what actually happened to
 * each job, and reports the ones that were really paid — with the customer,
 * the amount, and the reference to settle against.
 *
 * READ ONLY. It writes nothing, to either database or Cashflows. Crediting is
 * a decision for a person, not a script run at three in the morning.
 *
 *   node scripts/reconcile-failed-payments.mjs --days=30
 *   node scripts/reconcile-failed-payments.mjs --days=90 --json > owed.json
 *
 * Against production, from a laptop:
 *
 *   railway run --service RingTone_Riches_LIVE \
 *     node scripts/reconcile-failed-payments.mjs --days=30
 *
 * with READONLY_DATABASE_URL exported — Railway's own DATABASE_URL is
 * postgres.railway.internal, which resolves only inside their network.
 *
 * Needs DATABASE_URL (read-only is ideal) plus the Cashflows credentials for
 * the SAME environment the payments were taken in — production references do
 * not resolve against the integration gateway.
 */

import "dotenv/config";
import pg from "pg";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};
const asJson = args.includes("--json");
const days = Number(flag("days", 30));
const limit = Number(flag("limit", 500));

const log = (...a) => { if (!asJson) console.log(...a); };

const API_KEY = process.env.CASHFLOWS_API_KEY;
const CONFIG_ID = process.env.CASHFLOWS_CONFIGURATION_ID;
const BASE_URL = process.env.CASHFLOWS_BASE_URL;

if (!API_KEY || !CONFIG_ID || !BASE_URL) {
  console.error("Missing CASHFLOWS_API_KEY / CASHFLOWS_CONFIGURATION_ID / CASHFLOWS_BASE_URL");
  process.exit(1);
}
// This script only ever reads, so a read-only handle is strictly better and
// is preferred when one exists. It also keeps the production command short:
// `railway run` supplies the Cashflows credentials and an internal-only
// DATABASE_URL, and READONLY_DATABASE_URL supplies a host reachable from here.
const DATABASE_URL = process.env.READONLY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL (or READONLY_DATABASE_URL)");
  process.exit(1);
}

// Same authentication the app uses: SHA-512 of the API key, uppercase hex.
const hash = crypto.createHash("sha512").update(API_KEY, "utf8").digest("hex").toUpperCase();

async function fetchJob(jobRef) {
  const res = await fetch(`${BASE_URL}/payment-jobs/${jobRef}`, {
    headers: { ConfigurationId: CONFIG_ID, Hash: hash, "Content-Type": "application/json" },
  });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  return res.json();
}

/** The job's own verdict, and which attempt carried it. */
function readJob(body) {
  const data = body?.data ?? body ?? {};
  const status = String(data.status ?? "").toUpperCase();
  const payments = Array.isArray(data.payments) ? data.payments : [];
  const paid = payments.find((p) => String(p?.status ?? "").toUpperCase().includes("PAID"));
  const collected = Number(data.amountCollected ?? data.paidAmount ?? paid?.amount ?? 0);
  return {
    jobPaid: status.includes("PAID") || Boolean(paid),
    collected: Number.isFinite(collected) ? collected : 0,
    paidReference: paid?.reference ?? null,
    attempts: payments.length,
  };
}

// SSL only where the server actually offers it. A hosted database needs it;
// a local Postgres refuses the connection outright if it is forced on.
const needsSsl =
  process.env.NODE_ENV === "production" ||
  /\b(railway|rlwy\.net|amazonaws|render|supabase|neon)\b/.test(DATABASE_URL);

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

try {
  // A row is only interesting if we never wrote a transaction for it. That is
  // what "not credited" actually means — the status alone does not prove it.
  const { rows } = await pool.query(
    `select pp.id, pp.user_id, pp.amount, pp.payment_job_reference, pp.payment_reference,
            pp.order_id, pp.payment_type, pp.created_at,
            u.email, u.first_name, u.last_name
       from pending_payments pp
       join users u on u.id = pp.user_id
      where pp.status = 'failed'
        and pp.created_at > now() - ($1 || ' days')::interval
        and not exists (
          select 1 from transactions t where t.pending_payment_id = pp.id
        )
      order by pp.created_at desc
      limit $2`,
    [String(days), limit],
  );

  log(`Checking ${rows.length} failed payment(s) from the last ${days} days against Cashflows…\n`);

  const owed = [];
  const errors = [];

  for (const [i, row] of rows.entries()) {
    if (!asJson && (i + 1) % 10 === 0) log(`  …${i + 1}/${rows.length}`);
    let body;
    try {
      body = await fetchJob(row.payment_job_reference);
    } catch (err) {
      errors.push({ job: row.payment_job_reference, error: String(err?.message || err) });
      continue;
    }
    if (body?.error) {
      errors.push({ job: row.payment_job_reference, error: body.error });
      continue;
    }

    const verdict = readJob(body);
    if (!verdict.jobPaid) continue;

    owed.push({
      email: row.email,
      name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim(),
      userId: row.user_id,
      amountWeRecorded: Number(row.amount),
      amountCollected: verdict.collected,
      paymentJobReference: row.payment_job_reference,
      paidReference: verdict.paidReference,
      attempts: verdict.attempts,
      type: row.order_id ? "purchase" : "wallet top-up",
      when: row.created_at,
      pendingPaymentId: row.id,
    });

    // Cashflows is a payment gateway, not a scraping target.
    await new Promise((r) => setTimeout(r, 120));
  }

  if (asJson) {
    console.log(JSON.stringify({ checked: rows.length, owed, errors }, null, 2));
  } else {
    console.log(`\n${"=".repeat(70)}`);

    // Loud, and before the verdict. A sweep that could not reach Cashflows
    // finds nothing owed for the same reason a sweep of genuine declines
    // does, and "nothing owed" is exactly the wrong thing to believe when
    // the check never happened. Bad credentials or a gateway that is down
    // must never read as good news.
    if (errors.length) {
      const share = Math.round((errors.length / Math.max(1, rows.length)) * 100);
      console.log(
        `\n⚠️  ${errors.length} of ${rows.length} job(s) (${share}%) could NOT be checked.\n` +
        `   The result below covers only the ${rows.length - errors.length} that were.\n` +
        (share >= 50
          ? "   More than half failed — check the Cashflows credentials match the\n" +
            "   environment these payments were taken in, then run it again.\n"
          : ""),
      );
      console.table(errors.slice(0, 20));
      console.log("");
    }

    if (!owed.length) {
      console.log(
        errors.length
          ? "Nothing owed among the jobs that could be checked."
          : "Nothing owed. Every failed payment really did fail.",
      );
    } else {
      const total = owed.reduce((sum, o) => sum + (o.amountCollected || o.amountWeRecorded), 0);
      console.log(`COLLECTED BUT NEVER CREDITED: ${owed.length} payment(s), £${total.toFixed(2)}\n`);
      console.table(owed.map((o) => ({
        customer: o.email,
        amount: `£${(o.amountCollected || o.amountWeRecorded).toFixed(2)}`,
        type: o.type,
        attempts: o.attempts,
        when: new Date(o.when).toISOString().slice(0, 16).replace("T", " "),
        job: o.paymentJobReference,
      })));
      console.log("\nThese people paid and got nothing. Credit them, then keep this list.");
    }
  }
} finally {
  await pool.end();
}
