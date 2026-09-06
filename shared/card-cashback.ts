export const CARD_CASHBACK_RATE = 0.01;
export const CARD_CASHBACK_REF_PREFIX = "cb_";

export function cardCashbackAmount(cardSpend: number) {
  const spend = Math.round(Number(cardSpend) * 100) / 100;
  if (!Number.isFinite(spend) || spend < 0.01) return 0;
  const credit = Math.round(spend * CARD_CASHBACK_RATE * 100) / 100;
  return credit >= 0.01 ? credit : 0;
}

export function isCardCashbackTx(row?: { type?: string; description?: string | null } | null) {
  return row?.type === "deposit" && /card cashback/i.test(row.description || "");
}

export function formatCashbackPounds(credit: number) {
  return `£${Number(credit).toFixed(2)}`;
}

export function cardCashbackLine(cardSpend: number) {
  const credit = cardCashbackAmount(cardSpend);
  if (credit < 0.01) return "";
  return `${formatCashbackPounds(credit)} just landed in your wallet.`;
}
