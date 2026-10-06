/**
 * Turning a Golden Ticket win into a row on the public Past Winners wall.
 *
 * A Golden Ticket is handed out by Ringtone Riches rather than won from a
 * game, so none of the per-game winner paths ever recorded one. Five real cash
 * winners existed and none of them appeared on the wall.
 *
 * The one thing that needs care is `prizeValue`. The winners page decides
 * cash-from-points by looking for a "£" in that string: with one it reads the
 * number as pounds, without one it reads it as a points total. Golden Ticket
 * prizes are stored as a bare decimal, so writing "50.00" across unchanged
 * would put "50 Points" on the card for a £50 cash prize.
 */

export type GoldenTicketPrize = {
  /** cash | credit | physical */
  prizeType: string;
  /** The campaign name, which is what the player was told they had won. */
  prizeName: string;
  /** Pounds, as a decimal string or number. Null for a prize with no amount. */
  prizeValue: string | number | null;
};

/** Trailing zeros are noise on a whole-pound prize: £50, not £50.00. */
function formatPounds(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? `£${rounded}` : `£${rounded.toFixed(2)}`;
}

/**
 * What goes in `winners.prize_value`.
 *
 * Cash and site credit are both paid in pounds, so both carry the "£" that
 * marks them as cash. A physical prize has no cash value to show -- its stored
 * value is only there for admin reporting, and putting it on a public card
 * would price someone's prize for them -- so the prize name is used instead.
 */
export function winnerPrizeValue(prize: GoldenTicketPrize): string {
  const amount = prize.prizeValue == null ? null : Number(prize.prizeValue);
  const payable = prize.prizeType === "cash" || prize.prizeType === "credit";

  if (payable && amount != null && Number.isFinite(amount) && amount > 0) {
    return formatPounds(amount);
  }
  return prize.prizeName;
}

/**
 * Words that already say "Golden Ticket", in any spelling an admin might use.
 * Matched loosely because the campaign name is free text typed by a person.
 */
const ALREADY_SAYS_IT = /golden\s*ticket/i;

/**
 * What goes in `winners.prize_description`.
 *
 * The campaign name alone is not enough. Admins name campaigns after the prize
 * -- "£50 Cash", "£30 Takeaway Spend" -- so on the winners wall a Golden Ticket
 * read exactly like an ordinary game win, which defeats the point of putting
 * them there. The name is kept, because it is what the player was told they had
 * won, and the label goes in front of it.
 *
 * A campaign already named after the ticket keeps its own name rather than
 * being made to stutter: "£10 Golden Ticket", never
 * "Golden Ticket — £10 Golden Ticket".
 */
export function winnerPrizeDescription(prize: GoldenTicketPrize): string {
  const name = prize.prizeName?.trim();
  if (!name) return "Golden Ticket";
  if (ALREADY_SAYS_IT.test(name)) return name;
  return `Golden Ticket — ${name}`;
}
