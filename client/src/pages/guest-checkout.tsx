import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { billingPath, createOrderEndpoint } from "@/lib/play-paths";
import { startCartCardCheckout, type CartCheckoutProgress } from "@/lib/cart-card-checkout";
import CartCheckoutOverlay from "@/components/cart/CartCheckoutOverlay";
import CheckoutLaunch from "@/components/cart/CheckoutLaunch";
import { readBasket, type BasketItem } from "@/lib/basket";
import { isPlayableGameType } from "@/lib/ticket-price";
import { apiErrorMessage } from "@/lib/api-error";
import { Lock, Shield, UserCircle } from "lucide-react";

function fieldClass(hasError: boolean) {
  return `h-12 rounded-xl bg-white/[0.04] text-white placeholder:text-white/30 ${
    hasError ? "border-[#C8102E]" : "border-white/10"
  }`;
}

type SessionState = "checking" | "guest" | "signed-in";

export default function GuestCheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const search = useMemo(() => new URLSearchParams(window.location.search), []);
  const fromBasket = search.get("from") === "basket";
  const competitionId = search.get("competitionId") || "";
  const quantity = Math.max(1, parseInt(search.get("quantity") || "1", 10) || 1);
  const type = search.get("type") || "instant";
  const wheelType = search.get("wheelType") || "";
  const imageUrl = search.get("image") || "";
  const nextPath = `${window.location.pathname}${window.location.search}`;

  const [form, setForm] = useState({
    email: "",
    acceptTerms: false,
    ageConfirmed: false,
    receiveNewsletter: false,
  });
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [progress, setProgress] = useState<CartCheckoutProgress | null>(null);
  const [overlayItems, setOverlayItems] = useState<BasketItem[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const startedRef = useRef(false);

  const continueAsSession = async () => {
    if (fromBasket) {
      const items = readBasket();
      if (!items.length) {
        setLocation("/basket");
        return;
      }
      const needsQuiz = items.some((item) => !isPlayableGameType(item.type));
      if (needsQuiz) {
        setLocation("/basket?guestPay=1&autoPay=1");
        return;
      }
      setOverlayItems(items);
      setProgress({
        phase: "adding",
        step: 0,
        total: items.length,
        message: "Preparing your cart…",
      });
      setContinuing(true);
      try {
        await startCartCardCheckout({
          items,
          fromCart: true,
          onProgress: setProgress,
        });
      } catch (error: any) {
        toast({
          title: "Could not start checkout",
          description: apiErrorMessage(error, "Please try again."),
          variant: "destructive",
        });
        setLocation("/basket?guestPay=1");
      } finally {
        setContinuing(false);
      }
      return;
    }
    if (!competitionId) {
      toast({
        title: "Missing competition",
        description: "Go back and choose tickets again.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
    setProgress({
      phase: "adding",
      step: 1,
      total: 1,
      message: "Preparing payment…",
    });
    setContinuing(true);
    try {
      const res = await apiRequest(createOrderEndpoint(type), "POST", {
        competitionId,
        quantity,
        competitionImage: imageUrl || undefined,
      });
      const data = await res.json();
      const orderId = data.orderId || data.id;
      if (!orderId) throw new Error("Could not create that order.");
      if (imageUrl) localStorage.setItem(`competition_image_${orderId}`, imageUrl);
      try {
        await startCartCardCheckout({
          orderIds: [orderId],
          fromCart: false,
        });
      } catch (cardError: any) {
        toast({
          title: "Card payment",
          description: apiErrorMessage(cardError, "Continue on the next screen."),
        });
        setLocation(billingPath(type, orderId, { wheelType, imageUrl }));
      }
    } catch (error: any) {
      toast({
        title: "Could not start checkout",
        description: apiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setContinuing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/user", { credentials: "include" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401 || !res.ok) {
          setSessionState("guest");
          return;
        }
        setSessionState("signed-in");
      })
      .catch(() => {
        if (!cancelled) setSessionState("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sessionState !== "signed-in" || continuing || busy || magicSent) return;
    if (!startedRef.current) {
      startedRef.current = true;
      continueAsSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/guest/begin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, next: nextPath }),
      });
      const data = await res.json();
      if (res.status === 409 && data.code === "ACCOUNT_EXISTS") {
        toast({
          title: "Account found",
          description: "Log in with this email to finish paying.",
        });
        setLocation(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not start guest checkout.");
      }
      if (data.needsMagicLink) {
        setMagicSent(true);
        return;
      }
      startedRef.current = true;
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await continueAsSession();
    } catch (error: any) {
      toast({
        title: "Guest checkout paused",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const showForm = sessionState === "guest" && !magicSent && !continuing;

  return (
    <div className="rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere />
      <Header />
      {magicSent ? (
        <main className="relative z-10 mx-auto max-w-lg px-4 py-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">Check your email</p>
          <h1 className="mt-3 font-prize text-4xl">Link sent</h1>
          <p className="mt-4 text-sm text-white/55">
            We already have a guest checkout on {form.email}. Open the email and tap continue — it expires in 30 minutes.
          </p>
          <Link href="/" className="rr-cta mt-8 inline-flex px-6 py-2.5 text-sm">
            Back to home
          </Link>
        </main>
      ) : showForm ? (
      <main className="relative z-10 flex-1 pb-12 pt-5 sm:pt-8">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
              <UserCircle className="h-3.5 w-3.5 text-[#F1D47A]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                Guest · checkout
              </span>
            </div>
            <h1 className="font-prize text-4xl text-white sm:text-5xl">PAY WITHOUT AN ACCOUNT</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              {fromBasket
                ? "Just your email — then you go straight to secure card payment."
                : "Just your email. Then card payment, then your plays."}
            </p>
            <p className="mt-3 text-sm text-white/45">
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-[#F1D47A] underline">
                Log in
              </Link>
              {" · "}
              <Link href="/register" className="text-[#F1D47A] underline">
                Create account
              </Link>
            </p>
          </div>

          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#0A0A0D]/80 p-6 sm:p-8">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Email <span className="text-[#FF263D]">*</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
                className={fieldClass(false)}
                required
                autoComplete="email"
              />
            </div>

            <label className="mt-5 flex items-start gap-3 text-sm text-white/60">
              <Checkbox
                checked={form.ageConfirmed}
                onCheckedChange={(v) => setForm({ ...form, ageConfirmed: Boolean(v) })}
                className="mt-0.5"
              />
              I am 18 or over and a UK resident.
            </label>
            <label className="mt-3 flex items-start gap-3 text-sm text-white/60">
              <Checkbox
                checked={form.acceptTerms}
                onCheckedChange={(v) => setForm({ ...form, acceptTerms: Boolean(v) })}
                className="mt-0.5"
              />
              <span>
                I accept the{" "}
                <Link href="/termsAndConditions" className="text-[#F1D47A] underline">
                  terms and conditions
                </Link>
                .
              </span>
            </label>
            <label className="mt-3 flex items-start gap-3 text-sm text-white/60">
              <Checkbox
                checked={form.receiveNewsletter}
                onCheckedChange={(v) => setForm({ ...form, receiveNewsletter: Boolean(v) })}
                className="mt-0.5"
              />
              Email me offers (optional).
            </label>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#F1D47A]/20 bg-[#F1D47A]/5 p-4">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#F1D47A]" />
              <p className="text-sm text-white/55">
                After you pay, your tickets are sent to this email.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy || !form.acceptTerms || !form.ageConfirmed}
              className="rr-cta mt-6 w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Starting checkout…" : "Pay securely"}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
              <Lock className="h-3 w-3 text-[#F1D47A]" />
              SSL checkout
            </p>
          </form>
        </div>
      </main>
      ) : null}
      {!showForm && !magicSent && !continuing && (
        <CheckoutLaunch
          headline={sessionState === "checking" ? "Opening checkout" : "Taking you to payment"}
          subtitle={
            sessionState === "checking"
              ? "Lining up a secure card page for the plays in your cart."
              : "Don’t close this tab — the payment page is opening now."
          }
        />
      )}
      <CartCheckoutOverlay open={continuing} items={overlayItems} progress={progress} />
      <Footer />
    </div>
  );
}
