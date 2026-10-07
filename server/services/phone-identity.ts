/**
 * Recognising when two phone numbers are the same person.
 *
 * Accounts were being created in batches on one handset: three on
 * 07359126899 and two more on 07359126898, under five spellings of one name,
 * each taking the signup bonus and then farming the free daily spin. Points
 * buy entries at 1p each, so a farmed account is a free run at real cash
 * prizes.
 *
 * Registration only ever checked the email address, and `phone_number` has no
 * unique constraint, so none of it was irregular as far as the server was
 * concerned.
 *
 * Comparing the strings as typed would not have helped: the signup form
 * accepts `+`, spaces, dashes and brackets, so `+44 7348 683233` and
 * `07348683233` are one number stored two ways, and anyone who noticed the
 * check could walk past it by typing the other form.
 *
 * So numbers are compared on their last nine digits. For UK numbers that is
 * the subscriber part, identical across `07…`, `+447…`, `447…` and `00447…`,
 * which is every form the signup field permits. Nine rather than ten because
 * the leading `7` is carried by all UK mobiles and adds nothing.
 */

/** Everything the signup field allows, reduced to digits. */
function digitsOf(raw: string): string {
  return (raw || "").replace(/\D+/g, "");
}

/**
 * The value two numbers are compared on, or null when there is nothing to
 * compare.
 *
 * Null means "cannot tell", never "no match": a number too short to carry a
 * subscriber part must not collide with every other short number, so callers
 * treat null as "let it through" rather than as a key.
 */
export function phoneMatchKey(raw: string | null | undefined): string | null {
  const digits = digitsOf(String(raw ?? ""));
  if (digits.length < 9) return null;
  return digits.slice(-9);
}

/** Whether two numbers, in any accepted format, belong to one line. */
export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const ka = phoneMatchKey(a);
  const kb = phoneMatchKey(b);
  return ka !== null && ka === kb;
}

/**
 * The SQL that produces the same key, for the lookup and its index.
 *
 * Kept here beside the TypeScript so the two definitions are read together and
 * cannot drift apart. `migrations/0031_users_phone_match_key.sql` indexes this
 * exact expression, so the lookup must spell it exactly this way to use it.
 */
export const PHONE_MATCH_KEY_SQL = `RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 9)`;
