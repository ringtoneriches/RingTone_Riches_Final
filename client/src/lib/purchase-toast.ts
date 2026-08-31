type ToastFn = (opts: {
  variant?: "default" | "destructive" | "success";
  title?: string;
  description?: string;
  duration?: number;
}) => unknown;

const GENERIC_PURCHASE_COPY =
  /purchase (is )?complete|purchase completed|successful|instant play|tickets have been|tickets are ready|tickets have been issued/i;

function copyForType(orderType?: string) {
  switch (orderType) {
    case "scratch":
      return {
        title: "You're in",
        description: "Your cards are ready — scratch to reveal.",
      };
    case "pop":
      return {
        title: "You're in",
        description: "Your pops are live. Burst them.",
      };
    case "spin":
      return {
        title: "You're in",
        description: "Your spins are locked in. Take the wheel.",
      };
    case "plinko":
      return {
        title: "You're in",
        description: "Your drops are ready. Let it fall.",
      };
    case "voltz":
      return {
        title: "You're in",
        description: "You're charged up. Play now.",
      };
    case "slot":
      return {
        title: "You're in",
        description: "The reels are waiting. Spin now.",
      };
    case "royal":
      return {
        title: "You're in",
        description: "The reels are yours. Play now.",
      };
    case "competition":
      return {
        title: "You're entered",
        description: "Your tickets are locked in the draw.",
      };
    default:
      return {
        title: "You're in",
        description: "Your purchase is locked in. Play now.",
      };
  }
}

export function showPurchaseSuccessToast(
  toast: ToastFn,
  orderType?: string,
  serverMessage?: string,
) {
  const copy = copyForType(orderType);
  const useServer =
    Boolean(serverMessage) && !GENERIC_PURCHASE_COPY.test(serverMessage || "");

  toast({
    variant: "success",
    title: copy.title,
    description: useServer ? serverMessage : copy.description,
    duration: 9000,
  });
}
