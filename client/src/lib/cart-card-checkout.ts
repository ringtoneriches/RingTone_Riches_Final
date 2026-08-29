import { apiRequest } from "@/lib/queryClient";
import { markCartCheckout, type BasketItem } from "@/lib/basket";
import { createOrderEndpoint } from "@/lib/play-paths";

export type CartCheckoutProgress = {
  phase: "adding" | "opening" | "paying";
  step: number;
  total: number;
  title?: string;
  message: string;
};

export async function startCartCardCheckout(opts: {
  items?: BasketItem[];
  orderIds?: string[];
  fromCart?: boolean;
  onProgress?: (progress: CartCheckoutProgress) => void;
}) {
  const orderIds = [...(opts.orderIds || [])];

  if (!orderIds.length) {
    const items = opts.items || [];
    if (!items.length) throw new Error("Your cart is empty.");
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      opts.onProgress?.({
        phase: "adding",
        step: i + 1,
        total: items.length,
        title: item.title,
        message: items.length === 1 ? "Preparing payment…" : `Adding ${i + 1} of ${items.length}…`,
      });
      const createRes = await apiRequest(createOrderEndpoint(item.type), "POST", {
        competitionId: item.competitionId,
        quantity: item.quantity,
        competitionImage: item.imageUrl,
      });
      const created = await createRes.json();
      const orderId = created.orderId || created.id;
      if (!orderId) throw new Error("Could not create that order.");
      if (item.imageUrl) {
        localStorage.setItem(`competition_image_${orderId}`, item.imageUrl);
      }
      orderIds.push(orderId);
    }
  }

  opts.onProgress?.({
    phase: "opening",
    step: orderIds.length,
    total: orderIds.length || 1,
    message: "Opening secure payment…",
  });
  const payRes = await apiRequest("/api/cart/process-card-payment", "POST", { orderIds });
  const paid = await payRes.json();
  if (!paid.redirectUrl) {
    throw new Error(paid.message || "Could not start card payment.");
  }

  if (opts.fromCart) markCartCheckout();
  window.location.href = paid.redirectUrl;
  return { redirected: true as const, orderIds };
}
