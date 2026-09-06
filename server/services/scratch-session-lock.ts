type ScratchSessionPrize = {
  type: string;
  value: string;
  label?: string;
};

export type OpenScratchSession = {
  sessionId: string;
  userId: string;
  orderId: string;
  prizeId: string;
  isWinner: boolean;
  prize: ScratchSessionPrize;
  tileLayout: string[];
  ticketId?: string;
  controlledPool?: boolean;
  ticketNumber?: string | null;
};

type CompletedScratchSession = {
  userId: string;
  orderId: string;
  remainingCards: number;
  prize: ScratchSessionPrize;
  prizeLabel?: string;
};

const openByOrder = new Map<string, OpenScratchSession>();
const openBySessionId = new Map<string, OpenScratchSession>();
const completedBySession = new Map<string, CompletedScratchSession>();

function openKey(userId: string, orderId: string) {
  return `${userId}:${orderId}`;
}

export function getOpenScratchSession(userId: string, orderId: string) {
  const session = openByOrder.get(openKey(userId, orderId));
  if (!session) return null;
  if (completedBySession.has(session.sessionId)) {
    openByOrder.delete(openKey(userId, orderId));
    return null;
  }
  return session;
}

export function setOpenScratchSession(session: OpenScratchSession) {
  openByOrder.set(openKey(session.userId, session.orderId), session);
  openBySessionId.set(session.sessionId, session);
}

export function getOpenScratchSessionById(sessionId: string) {
  if (completedBySession.has(sessionId)) return null;
  return openBySessionId.get(sessionId) || null;
}

export function getCompletedScratchSession(sessionId: string) {
  return completedBySession.get(sessionId) || null;
}

export function markScratchSessionCompleted(
  sessionId: string,
  result: CompletedScratchSession,
) {
  completedBySession.set(sessionId, result);
  openByOrder.delete(openKey(result.userId, result.orderId));
  openBySessionId.delete(sessionId);
}
