import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import ChaserBorder from "@/components/home/ChaserBorder";
import QuantitySelector from "@/components/home/QuantitySelector";
import { useBasket } from "@/hooks/useBasket";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { apiErrorMessage } from "@/lib/api-error";
import { lineTotal } from "@/lib/ticket-price";
import {
  createOrderEndpoint,
  gameTypeLabel,
  processPaymentEndpoint,
} from "@/lib/play-paths";
import { startCartCardCheckout, type CartCheckoutProgress } from "@/lib/cart-card-checkout";
import CartCheckoutOverlay from "@/components/cart/CartCheckoutOverlay";
import CheckoutLaunch from "@/components/cart/CheckoutLaunch";
import type { BasketItem } from "@/lib/basket";
import { MIN_PURCHASE, validateMinimumPurchase } from "@/components/unified-billing";
import { User } from "@shared/schema";
import {
  ShoppingBag,
  Trash2,
  Wallet,
  Music,
  Lock,
  ArrowRight,
  Sparkles,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const QUIZ = {
  question: "You wake up at 7:00am and take 30 minutes to get ready. What time are you ready?",
  options: ["7:15am", "7:25am", "7:30am", "7:45am"],
  correct: "7:30am",
};

function getValidBalance(balance: string | null | undefined): number {
  if (!balance) return 0;
  const cleaned = balance.toString().replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

export default function BasketPage() {
  const { items, totals, setQty, remove, clear } = useBasket();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [methods, setMethods] = useState({
    wallet: false,
    points: false,
    instaplay: false,
  });
  const [progress, setProgress] = useState<CartCheckoutProgress | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<BasketItem[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [guestLaunch, setGuestLaunch] = useState(false);
  const autoPayStarted = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("guestPay") === "1") {
      setMethods({ wallet: false, points: false, instaplay: true });
    }
  }, []);

  const { data: userData } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  const walletBalance = getValidBalance(userData?.balance ?? user?.balance);
  const ringtonePoints = userData?.ringtonePoints ?? user?.ringtonePoints ?? 0;
  const pointsValue = ringtonePoints * 0.01;
  const hasInstant = items.some((item) => !["spin", "scratch", "pop", "plinko", "voltz", "slot", "royal"].includes(item.type));
  const pointsAllowed = !hasInstant;
  let remainingAmount = totals.pay;
  let walletUsed = 0;
  let pointsUsed = 0;
  if (!methods.instaplay && methods.wallet) {
    walletUsed = Math.min(walletBalance, remainingAmount);
    remainingAmount -= walletUsed;
  }
  if (!methods.instaplay && methods.points && pointsAllowed) {
    pointsUsed = Math.min(pointsValue, remainingAmount);
    remainingAmount -= pointsUsed;
  }
  remainingAmount = Math.max(0, remainingAmount);
  const hasSelectedMethod = methods.wallet || (methods.points && pointsAllowed) || methods.instaplay;
  const instaplayBlocked = methods.instaplay && totals.pay < MIN_PURCHASE;
  const walletShort = hasSelectedMethod && !methods.instaplay && remainingAmount > 0.009;

  const checkout = useMutation({
    mutationFn: async () => {
      if (!items.length) throw new Error("Your cart is empty.");
      if (!isAuthenticated) throw new Error("login-required");
      if (!hasSelectedMethod) throw new Error("Choose a payment method.");
      if (methods.instaplay) {
        const validation = validateMinimumPurchase(totals.pay, "instaplay");
        if (!validation.valid) throw new Error(validation.message || `Minimum £${MIN_PURCHASE} for card checkout.`);
      } else if (remainingAmount > 0.009) {
        throw new Error(`Need £${remainingAmount.toFixed(2)} more in your wallet.`);
      }

      const snapshot = [...items];
      setCheckoutItems(snapshot);

      if (methods.instaplay) {
        setProgress({
          phase: "adding",
          step: 0,
          total: snapshot.length,
          message: "Preparing your cart…",
        });
        await startCartCardCheckout({
          items: snapshot,
          fromCart: true,
          onProgress: setProgress,
        });
        return { paid: snapshot.length, redirected: true };
      }

      let paid = 0;
      for (const item of snapshot) {
        setProgress({
          phase: "paying",
          step: paid + 1,
          total: snapshot.length,
          title: item.title,
          message: `Paying ${paid + 1} of ${snapshot.length}…`,
        });
        const createRes = await apiRequest(createOrderEndpoint(item.type), "POST", {
          competitionId: item.competitionId,
          quantity: item.quantity,
          competitionImage: item.imageUrl,
        });
        const created = await createRes.json();
        const orderId = created.orderId || created.id;
        if (!orderId) throw new Error("Could not create that order.");

        const isGame = ["spin", "scratch", "pop", "plinko", "voltz", "slot", "royal"].includes(item.type);
        const payRes = await apiRequest(processPaymentEndpoint(item.type), "POST", {
          orderId,
          competitionId: item.competitionId,
          quantity: item.quantity,
          useWalletBalance: methods.wallet,
          useRingtonePoints: methods.points && isGame,
          useInstaplay: false,
        });
        const paidOrder = await payRes.json();
        if (paidOrder.redirectUrl || Number(paidOrder.remainingAmount || 0) > 0) {
          throw new Error(
            "This cart still needs a card payment. Select Instant Play, or top up your wallet."
          );
        }

        remove(item.competitionId);
        paid += 1;
      }

      return { paid, redirected: false };
    },
    onSuccess: (result) => {
      setProgress(null);
      if (result.redirected) return;
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/tickets"] });
      toast({
        title: "You're in",
        description: result.paid === 1 ? "Your game is ready to play." : `${result.paid} games are ready to play.`,
      });
      setLocation("/my-plays");
    },
    onError: (error) => {
      setProgress(null);
      if (apiErrorMessage(error) === "login-required" || /401/.test(String((error as Error)?.message))) {
        toast({
          title: "Checkout as guest",
          description: "Enter your details to pay without creating an account, or log in.",
        });
        setGuestLaunch(true);
        setLocation("/guest-checkout?from=basket");
        return;
      }
      const message = apiErrorMessage(error);
      if (message.includes("Need £")) {
        toast({
          title: "Top up to finish",
          description: message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Checkout paused",
        description: message,
        variant: "destructive",
      });
    },
  });

  const toggleMethod = (method: "wallet" | "points" | "instaplay") => {
    if (method === "points" && !pointsAllowed) {
      toast({
        title: "Points not available",
        description: "Prize-draw tickets in this cart cannot use Ringtone Points.",
      });
      return;
    }
    if (method === "instaplay") {
      setMethods({ wallet: false, points: false, instaplay: !methods.instaplay });
      return;
    }
    if (methods.instaplay) {
      setMethods({
        wallet: method === "wallet",
        points: method === "points",
        instaplay: false,
      });
      return;
    }
    setMethods((prev) => ({ ...prev, [method]: !prev[method] }));
  };

  const startCheckout = () => {
    if (!isAuthenticated) {
      setGuestLaunch(true);
      setLocation("/guest-checkout?from=basket");
      return;
    }
    if (!hasSelectedMethod) {
      toast({ title: "Select a payment method", description: "Wallet, Ringtone Points, or pay by card." });
      return;
    }
    if (instaplayBlocked) {
      const validation = validateMinimumPurchase(totals.pay, "instaplay");
      toast({
        variant: "destructive",
        title: `Minimum £${MIN_PURCHASE} for card`,
        description: validation.message,
      });
      return;
    }
    if (walletShort) {
      toast({
        title: "Top up to finish",
        description: `Need £${remainingAmount.toFixed(2)} more, or pay the cart by card.`,
        variant: "destructive",
      });
      return;
    }
    if (hasInstant) {
      setSelectedAnswer(null);
      setShowQuiz(true);
      return;
    }
    checkout.mutate();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoPay") !== "1") return;
    if (!methods.instaplay || !isAuthenticated || !items.length || autoPayStarted.current) return;
    if (instaplayBlocked) return;
    autoPayStarted.current = true;
    window.history.replaceState({}, "", "/basket");
    if (hasInstant) {
      setSelectedAnswer(null);
      setShowQuiz(true);
      return;
    }
    checkout.mutate();
  }, [isAuthenticated, items.length, methods.instaplay, instaplayBlocked, hasInstant]);

  const emptyCopy = useMemo(
    () => ({
      title: "Your cart is empty",
      body: "Add a few games from the competitions board, then pay once here.",
    }),
    []
  );

  return (
    <div className="rr-cart rr-page min-h-screen overflow-x-clip bg-[#050505] text-white">
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
        <Header />

        <section className="px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 max-w-2xl sm:mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">Cart</p>
              <h1 className="mt-2 font-prize text-[2.15rem] leading-[0.92] text-white sm:text-5xl lg:text-[3.4rem]">
                YOUR CART,
                <span className="mt-1 block text-[#F1D47A]">YOUR CHOICE</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                Add plays from multiple games, then check out in one simple payment.
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/40 sm:text-base">
                ENTER NOW is still there when you just want to jump straight into one game.
              </p>
            </div>

            {items.length === 0 ? (
              <ChaserBorder variant="card" className="max-w-xl">
                <div className="flex flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-14">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                    <ShoppingBag className="h-7 w-7 text-[#F1D47A]" />
                  </div>
                  <h2 className="font-prize text-2xl text-white sm:text-3xl">{emptyCopy.title}</h2>
                  <p className="mt-3 max-w-sm text-sm text-white/50">{emptyCopy.body}</p>
                  <Link href="/">
                    <button className="rr-cta mt-7 inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.14em]">
                      Browse competitions
                    </button>
                  </Link>
                </div>
              </ChaserBorder>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4">
                  {items.map((item) => {
                    const line = lineTotal(item.ticketPrice, item.quantity, item.type);
                    return (
                      <ChaserBorder key={item.competitionId} variant="card">
                        <article className="p-3.5 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="h-[4.75rem] w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:h-28 sm:w-24">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[#F1D47A]">
                                  <ShoppingBag className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
                                {gameTypeLabel(item.type)}
                              </p>
                              <h3 className="mt-1 line-clamp-2 font-prize text-lg leading-tight text-white sm:text-2xl">
                                {item.title}
                              </h3>
                              <p className="mt-1 text-xs text-white/40">
                                £{parseFloat(item.ticketPrice || "0").toFixed(2)} each
                                {line.savings > 0 && (
                                  <span className="ml-2 text-[#F1D47A]">· {line.discountPercent}% bundle off</span>
                                )}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(item.competitionId)}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-[#FF263D]/40 hover:text-[#FF263D]"
                              aria-label={`Remove ${item.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                            <QuantitySelector
                              value={item.quantity}
                              min={1}
                              max={500}
                              onChange={(qty) => setQty(item.competitionId, qty)}
                            />
                            <div className="min-w-0 text-right">
                              {line.savings > 0 && (
                                <p className="text-xs text-white/35 line-through">£{line.originalPrice.toFixed(2)}</p>
                              )}
                              <p className="font-prize text-xl text-[#F1D47A] sm:text-2xl">£{line.discountedPrice.toFixed(2)}</p>
                            </div>
                          </div>
                        </article>
                      </ChaserBorder>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => clear()}
                    className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35 hover:text-white/70"
                  >
                    Clear cart
                  </button>
                </div>

                <aside className="lg:sticky lg:top-28 lg:self-start">
                  <ChaserBorder variant="card">
                    <div className="p-4 sm:p-6">
                      <h2 className="font-prize text-2xl text-white sm:text-3xl">PAY ONCE</h2>
                      <div className="mt-5 space-y-2 text-sm">
                        <div className="flex justify-between text-white/50">
                          <span>Lines</span>
                          <span>{items.length}</span>
                        </div>
                        {totals.savings > 0 && (
                          <div className="flex justify-between text-[#F1D47A]">
                            <span className="inline-flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5" /> Bundle save
                            </span>
                            <span>−£{totals.savings.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-3">
                          <span className="text-xs font-black uppercase tracking-widest text-white/40">Total</span>
                          <span className="font-prize text-3xl leading-none text-[#F1D47A] sm:text-4xl">£{totals.pay.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                          Payment method
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleMethod("wallet")}
                          data-testid="cart-pay-wallet"
                          className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors sm:gap-3 sm:px-3.5 ${
                            methods.wallet
                              ? "border-[#D4AF37]/55 bg-[#D4AF37]/10"
                              : "border-white/10 bg-black/30"
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 sm:h-10 sm:w-10">
                            <Wallet className="h-4 w-4 text-[#F1D47A]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-bold">Wallet balance</span>
                              <span className="shrink-0 rounded-full border border-[#D4AF37]/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#F1D47A]">
                                Fast
                              </span>
                            </span>
                            <span className="mt-0.5 block text-xs text-white/45">
                              Available £{walletBalance.toFixed(2)}
                              {methods.wallet && walletUsed > 0 && (
                                <span className="ml-1 text-[#F1D47A]">· using £{walletUsed.toFixed(2)}</span>
                              )}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              methods.wallet ? "border-[#F1D47A] bg-[#F1D47A]" : "border-white/25"
                            }`}
                          >
                            {methods.wallet && <span className="h-1.5 w-1.5 rounded-full bg-black" />}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleMethod("points")}
                          data-testid="cart-pay-points"
                          className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors sm:gap-3 sm:px-3.5 ${
                            !pointsAllowed
                              ? "cursor-not-allowed border-white/10 bg-black/20 opacity-50"
                              : methods.points
                                ? "border-[#D4AF37]/55 bg-[#D4AF37]/10"
                                : "border-white/10 bg-black/30"
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 sm:h-10 sm:w-10">
                            <Music className="h-4 w-4 text-[#F1D47A]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-bold">Ringtone Points</span>
                              {!pointsAllowed && (
                                <span className="shrink-0 rounded-full bg-[#FF263D]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#FF263D]">
                                  N/A
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs text-white/45">
                              {ringtonePoints.toLocaleString()} pts · £{pointsValue.toFixed(2)}
                              {pointsAllowed && methods.points && pointsUsed > 0 && (
                                <span className="ml-1 text-[#F1D47A]">· using £{pointsUsed.toFixed(2)}</span>
                              )}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              methods.points && pointsAllowed ? "border-[#F1D47A] bg-[#F1D47A]" : "border-white/25"
                            }`}
                          >
                            {methods.points && pointsAllowed && <span className="h-1.5 w-1.5 rounded-full bg-black" />}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleMethod("instaplay")}
                          data-testid="cart-pay-card"
                          className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-colors sm:gap-3 sm:px-3.5 ${
                            methods.instaplay
                              ? "border-[#C8102E]/55 bg-[#C8102E]/10"
                              : "border-white/10 bg-black/30"
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C8102E]/30 bg-[#C8102E]/10 sm:h-10 sm:w-10">
                            <CreditCard className="h-4 w-4 text-[#FF263D]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-bold">Instant Play</span>
                              <span className="shrink-0 rounded-full border border-[#C8102E]/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#FF263D]">
                                Card
                              </span>
                            </span>
                            <span className="mt-0.5 block text-xs text-white/45">
                              Pay by card · no wallet top-up
                              {methods.instaplay && instaplayBlocked && (
                                <span className="mt-1 block text-[#FF263D]">
                                  Card needs £{MIN_PURCHASE.toFixed(2)} per game, same as ENTER NOW
                                </span>
                              )}
                              {methods.instaplay && !instaplayBlocked && items.length > 1 && (
                                <span className="mt-1 block text-[#F1D47A]">
                                  Card checkout confirms each game in turn
                                </span>
                              )}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              methods.instaplay ? "border-[#FF263D] bg-[#FF263D]" : "border-white/25"
                            }`}
                          >
                            {methods.instaplay && <span className="h-1.5 w-1.5 rounded-full bg-black" />}
                          </span>
                        </button>
                      </div>

                      {walletShort && (
                        <div className="mt-4 rounded-xl border border-[#FF263D]/30 bg-[#FF263D]/10 px-4 py-3 text-sm text-white/80">
                          Need £{remainingAmount.toFixed(2)} more, or switch to Instant Play.
                          <Link href="/wallet?tab=wallet" className="mt-1 block font-bold text-[#F1D47A] underline sm:ml-2 sm:mt-0 sm:inline">
                            Top up wallet
                          </Link>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={checkout.isPending || !hasSelectedMethod || instaplayBlocked || walletShort}
                        onClick={startCheckout}
                        className="rr-cta mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-black uppercase tracking-[0.14em] disabled:opacity-50 sm:h-14"
                      >
                        <span className="relative z-[1] min-w-0 truncate whitespace-nowrap">
                          {methods.instaplay ? "Pay by card" : `Pay £${totals.pay.toFixed(2)}`}
                        </span>
                        {!checkout.isPending && <ArrowRight className="relative z-[1] h-4 w-4 shrink-0" />}
                      </button>
                      <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                        <Lock className="mr-1 inline h-3 w-3 text-[#F1D47A]" />
                        Same tickets and prices as ENTER NOW
                      </p>
                      <p className="mt-4 text-center text-xs text-white/40">
                        After payment, play everything on{" "}
                        <Link href="/my-plays" className="text-[#F1D47A] underline">
                          My Plays
                        </Link>
                        .
                      </p>
                    </div>
                  </ChaserBorder>
                </aside>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>

      {guestLaunch && (
        <CheckoutLaunch
          headline="Opening checkout"
          subtitle="Lining up a secure card page for the plays in your cart."
        />
      )}
      <CartCheckoutOverlay
        open={checkout.isPending}
        items={checkoutItems.length ? checkoutItems : items}
        progress={progress}
      />

      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="mx-auto w-[90vw] max-w-sm rounded-2xl border border-white/10 bg-[#0A0A0D] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-prize text-2xl text-white">
              Answer to proceed
            </DialogTitle>
          </DialogHeader>
          <p className="text-center font-medium text-white/70">{QUIZ.question}</p>
          <div className="grid grid-cols-1 gap-2">
            {QUIZ.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedAnswer(option)}
                className={`w-full rounded-xl border-2 p-3 font-semibold transition-all ${
                  selectedAnswer === option
                    ? "border-transparent bg-[#C8102E] text-white"
                    : "border-white/10 bg-white/[0.02] text-white hover:border-[#C8102E]/40"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <DialogFooter className="flex justify-center">
            <Button
              disabled={!selectedAnswer}
              onClick={() => {
                if (selectedAnswer !== QUIZ.correct) {
                  toast({
                    title: "Wrong Answer ❌",
                    description: "That's not correct! Try again next time.",
                    variant: "destructive",
                  });
                  setShowQuiz(false);
                  return;
                }
                setShowQuiz(false);
                checkout.mutate();
              }}
              className="rr-cta mt-4 h-11 rounded-xl px-8 font-black uppercase tracking-wider text-white disabled:opacity-50"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
