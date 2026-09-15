import { HIDDEN_COMPETITION_IDS } from "@/lib/competition-display";
import { isPlayableGameType } from "@/lib/ticket-price";

const EXPIRE_TYPES = new Set(["spin", "scratch", "pop", "plinko", "voltz"]);
const PLAY_WINDOW_MS = 2 * 60 * 60 * 1000;

export type UnplayedOrder = {
  competitions?: {
    title?: string;
    imageUrl?: string;
    ticketPrice?: string;
    type?: string;
  };
  orders: {
    id: string;
    competitionId: string;
    quantity: number;
    status: string;
    createdAt: string;
  };
  // Drizzle hands these back as Date objects; the API serialises them to strings.
  tickets?: Array<{ createdAt?: string | Date | null }>;
  remainingPlays?: number;
};

export function remainingForOrder(order: UnplayedOrder) {
  return Math.max(0, Number(order.remainingPlays || 0));
}

export function isPlayWindowType(type?: string) {
  return EXPIRE_TYPES.has((type || "").toLowerCase());
}

/**
 * When the play window starts: the moment the customer actually paid.
 *
 * Tickets are issued inside the payment transaction, so the earliest ticket is
 * when the purchase completed. The order row is created earlier, at checkout,
 * so measuring from it started the clock while the customer was still on the
 * card page. Falls back to the order for rows that have no tickets.
 */
function playWindowStart(order: UnplayedOrder) {
  let earliest = Number.POSITIVE_INFINITY;
  for (const ticket of order.tickets || []) {
    const issued = ticket?.createdAt ? new Date(ticket.createdAt).getTime() : NaN;
    if (!Number.isNaN(issued)) earliest = Math.min(earliest, issued);
  }
  if (earliest !== Number.POSITIVE_INFINITY) return earliest;
  return new Date(order.orders.createdAt).getTime();
}

export function playWindowMs(order: UnplayedOrder) {
  return playWindowStart(order) + PLAY_WINDOW_MS - Date.now();
}

export function isPlayExpired(order: UnplayedOrder) {
  if (!isPlayWindowType(order.competitions?.type)) return false;
  return playWindowMs(order) <= 0;
}

export function isReadyToPlay(order: UnplayedOrder) {
  const type = (order.competitions?.type || "").toLowerCase();
  const status = order.orders.status;
  if (!isPlayableGameType(type)) return false;
  if (!["paid", "completed"].includes(status)) return false;
  if (remainingForOrder(order) <= 0) return false;
  if (HIDDEN_COMPETITION_IDS.includes(order.orders.competitionId)) return false;
  return true;
}

export function readyToPlayOrders(orders: UnplayedOrder[]) {
  return orders.filter(isReadyToPlay);
}
