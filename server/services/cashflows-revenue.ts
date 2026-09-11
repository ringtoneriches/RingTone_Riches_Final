import { sql, type SQL } from "drizzle-orm";
import { db } from "../db";

export type CashflowsRevenue = {
  /** All money Cashflows took: top-ups + card game purchases (users and guests). */
  total: number;
  topupTotal: number;
  cardPurchaseTotal: number;
  count: number;
  uniqueCustomers: number;
};

type RevenueOptions = {
  from?: Date | null;
  to?: Date | null;
  search?: string | null;
};

const money = (value: unknown) => Math.round((Number(value) || 0) * 100) / 100;

/** Timestamps are stored as UTC wall time, so compare against a UTC ISO string. */
function utcTimestamp(date?: Date | null) {
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function inRange(column: string, from: string | null, to: string | null): SQL {
  return sql.join(
    [
      from ? sql`${sql.raw(column)} >= ${from}::timestamp` : sql`true`,
      to ? sql`${sql.raw(column)} <= ${to}::timestamp` : sql`true`,
    ],
    sql` AND `,
  );
}

function likePattern(search: string) {
  return `%${search.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

/**
 * Money that actually went through Cashflows: completed payment jobs for wallet top-ups,
 * card game purchases and guest checkout. Card cashback, signup bonuses and wallet/points
 * spending never touch Cashflows, so they are not revenue here. This matches the Cashflows
 * portal's "Total Sales" when both use the same day boundaries.
 */
export async function getCashflowsRevenue(options: RevenueOptions = {}): Promise<CashflowsRevenue> {
  const from = utcTimestamp(options.from);
  const to = utcTimestamp(options.to);
  const search = options.search?.trim();
  const pattern = search ? likePattern(search) : null;

  const userSearch = pattern
    ? sql`(concat_ws(' ', u.first_name, u.last_name) ILIKE ${pattern}
        OR u.email ILIKE ${pattern}
        OR p.payment_reference ILIKE ${pattern}
        OR p.payment_job_reference ILIKE ${pattern}
        OR p.amount::text ILIKE ${pattern})`
    : sql`true`;
  const guestSearch = pattern
    ? sql`(o.guest_name ILIKE ${pattern}
        OR o.guest_email ILIKE ${pattern}
        OR g.payment_reference ILIKE ${pattern}
        OR g.payment_job_reference ILIKE ${pattern}
        OR g.amount::text ILIKE ${pattern})`
    : sql`true`;

  const result = await db.execute(sql`
    WITH paid AS (
      SELECT coalesce(p.payment_type, 'wallet_topup') AS kind, p.amount, p.user_id AS customer
      FROM pending_payments p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.status = 'completed'
        AND ${inRange("p.created_at", from, to)}
        AND ${userSearch}
      UNION ALL
      SELECT 'guest' AS kind, g.amount, lower(o.guest_email) AS customer
      FROM guest_pending_payments g
      LEFT JOIN guest_orders o ON o.id = g.guest_order_id
      WHERE g.status = 'completed'
        AND ${inRange("g.created_at", from, to)}
        AND ${guestSearch}
    )
    SELECT
      count(*)::int AS count,
      coalesce(sum(amount), 0) AS total,
      coalesce(sum(amount) FILTER (WHERE kind = 'wallet_topup'), 0) AS topup_total,
      count(DISTINCT customer)::int AS unique_customers
    FROM paid
  `);

  const row = (result.rows?.[0] ?? {}) as Record<string, unknown>;
  const total = money(row.total);
  const topupTotal = money(row.topup_total);

  return {
    total,
    topupTotal,
    cardPurchaseTotal: money(total - topupTotal),
    count: Number(row.count) || 0,
    uniqueCustomers: Number(row.unique_customers) || 0,
  };
}
