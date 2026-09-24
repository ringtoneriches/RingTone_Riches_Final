import { useEffect, useState } from "react";
import GoldenTicketReveal, { type GoldenTicketAward } from "./GoldenTicketReveal";
import { subscribeGoldenTicket } from "@/lib/golden-ticket";

/**
 * Mounted once at the app root so every game gets the reveal for free — a game
 * only has to publish its ticket when its own animation has finished.
 */
export default function GoldenTicketRevealHost() {
  const [award, setAward] = useState<GoldenTicketAward | null>(null);

  useEffect(() => subscribeGoldenTicket(setAward), []);

  return <GoldenTicketReveal award={award} onClose={() => setAward(null)} />;
}
