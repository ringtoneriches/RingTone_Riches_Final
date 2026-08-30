export function billingPath(
  type: string | undefined,
  orderId: string,
  opts?: { wheelType?: string | null; imageUrl?: string | null },
) {
  const imageParam = opts?.imageUrl ? `?image=${encodeURIComponent(opts.imageUrl)}` : "";
  switch ((type || "").toLowerCase()) {
    case "spin":
      return `/spin-billing/${orderId}/${opts?.wheelType || "default"}${imageParam}`;
    case "scratch":
      return `/scratch-billing/${orderId}${imageParam}`;
    case "pop":
      return `/pop-billing/${orderId}${imageParam}`;
    case "plinko":
      return `/plinko-billing/${orderId}${imageParam}`;
    case "voltz":
      return `/voltz-billing/${orderId}${imageParam}`;
    case "slot":
      return `/slot-billing/${orderId}${imageParam}`;
    case "royal":
      return `/royal-billing/${orderId}${imageParam}`;
    default:
      return `/checkout/${orderId}${imageParam}`;
  }
}

export function playPath(type: string | undefined, competitionId: string, orderId: string) {
  switch ((type || "").toLowerCase()) {
    case "spin":
      return `/spin/${competitionId}/${orderId}`;
    case "scratch":
      return `/scratch/${competitionId}/${orderId}`;
    case "pop":
      return `/pop/${competitionId}/${orderId}`;
    case "plinko":
      return `/plinko/${competitionId}/${orderId}`;
    case "voltz":
      return `/voltz/${competitionId}/${orderId}`;
    case "slot":
      return `/slot/${competitionId}/${orderId}`;
    case "royal":
      return `/royal/${competitionId}/${orderId}`;
    default:
      return `/competition/${competitionId}`;
  }
}

export function createOrderEndpoint(type: string | undefined) {
  switch ((type || "").toLowerCase()) {
    case "spin":
      return "/api/create-spin-order";
    case "scratch":
      return "/api/create-scratch-order";
    case "pop":
      return "/api/create-pop-order";
    case "plinko":
      return "/api/create-plinko-order";
    case "voltz":
      return "/api/create-voltz-order";
    case "slot":
      return "/api/create-slot-order";
    case "royal":
      return "/api/create-royal-order";
    default:
      return "/api/create-competition-order";
  }
}

export function processPaymentEndpoint(type: string | undefined) {
  switch ((type || "").toLowerCase()) {
    case "spin":
      return "/api/process-spin-payment";
    case "scratch":
      return "/api/process-scratch-payment";
    case "pop":
      return "/api/process-pop-payment";
    case "plinko":
      return "/api/process-plinko-payment";
    case "voltz":
      return "/api/process-voltz-payment";
    case "slot":
      return "/api/process-slot-payment";
    case "royal":
      return "/api/process-royal-payment";
    default:
      return "/api/purchase-ticket";
  }
}

export function gameTypeLabel(type?: string) {
  switch ((type || "").toLowerCase()) {
    case "spin":
      return "Spin";
    case "scratch":
      return "Scratch Nations";
    case "pop":
      return "Pop";
    case "plinko":
      return "Plinko";
    case "voltz":
      return "Voltz";
    case "slot":
      return "Slot";
    case "royal":
      return "Royal Reels";
    case "instant":
      return "Prize draw";
    default:
      return "Competition";
  }
}
