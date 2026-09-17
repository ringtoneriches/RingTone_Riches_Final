import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Gift, Sparkles } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import ChaserBorder from "@/components/home/ChaserBorder";
import DailySpinWheel, { type WheelSegment } from "@/components/games/DailySpinWheel";
import BrandWait from "@/components/brand/BrandWait";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SpinState = {
  enabled: boolean;
  eligible?: boolean;
  reason?: string;
  message?: string;
  segments: WheelSegment[];
  hasSpunToday: boolean;
  lastResult?: { pointsValue: number; segmentIndex: number } | null;
  nextSpinAt: string;
};

type SpinResult = {
  alreadySpun: boolean;
  pointsValue: number;
  segmentIndex: number;
  nextSpinAt: string;
};

/** Counts down to the next free spin. */
function NextSpin({ at }: { at: string }) {
  const [left, setLeft] = useState(() => new Date(at).getTime() - Date.now());

  useEffect(() => {
    setLeft(new Date(at).getTime() - Date.now());
    const id = setInterval(() => setLeft(new Date(at).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [at]);

  if (left <= 0) return <span>Your next spin is ready — refresh the page.</span>;

  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className="font-prize text-2xl text-[#F1D47A] sm:text-3xl">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export default function DailySpinPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [spinning, setSpinning] = useState(false);
  const [landOn, setLandOn] = useState<number | null>(null);
  const [won, setWon] = useState<number | null>(null);

  const { data, isLoading } = useQuery<SpinState>({
    queryKey: ["/api/daily-spin"],
    enabled: isAuthenticated,
  });

  const spin = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/daily-spin", "POST", {});
      return (await res.json()) as SpinResult;
    },
    onSuccess: (result) => {
      // The result is already decided; the wheel just animates to it.
      setLandOn(result.segmentIndex);
      setSpinning(true);
    },
    onError: (error: any) => {
      toast({
        title: "Could not spin",
        description: String(error?.message || "").replace(/^\d+:\s*/, "") || "Please try again shortly.",
        variant: "destructive",
      });
    },
  });

  const handleSettled = useCallback(() => {
    setSpinning(false);
    const points = spin.data?.pointsValue ?? null;
    setWon(points);
    if (points !== null && !spin.data?.alreadySpun) {
      toast({ title: `You won ${points} points!`, description: "Added to your Ringtone Points." });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/daily-spin"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, [spin.data, toast, queryClient]);

  const alreadyDone = Boolean(data?.hasSpunToday) && !spinning && won === null;
  const canSpin = Boolean(data?.enabled) && !data?.hasSpunToday && !spinning && !spin.isPending;

  return (
    <div className="rr-page min-h-screen overflow-x-clip bg-[#050505] text-white">
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
        <Header />

        <section className="px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                Free every day
              </p>
              <h1 className="mt-2 font-prize text-[2.15rem] leading-none text-white sm:text-5xl lg:text-6xl">
                DAILY SPIN
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-white/50 sm:text-base">
                One free spin every day. Win Ringtone Points to spend on games — no purchase, no catch.
              </p>
            </div>

            {!isAuthenticated && !authLoading ? (
              <ChaserBorder variant="card" className="mx-auto max-w-xl">
                <div className="px-4 py-10 text-center sm:px-6 sm:py-14">
                  <Gift className="mx-auto h-10 w-10 text-[#F1D47A]" />
                  <h2 className="mt-4 font-prize text-2xl sm:text-3xl">Sign in to spin</h2>
                  <p className="mt-2 text-sm text-white/50">
                    The daily spin is free for members. Log in or join to take yours.
                  </p>
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href="/login">
                      <button className="rr-cta inline-flex h-12 w-full items-center justify-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.14em] sm:w-auto">
                        Login
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className="rr-header-ghost h-12 w-full px-6 text-xs sm:w-auto">Join free</button>
                    </Link>
                  </div>
                </div>
              </ChaserBorder>
            ) : isLoading || authLoading ? (
              <BrandWait mode="embed" kicker="Daily Spin" headline="Loading your spin" />
            ) : !data?.enabled ? (
              <ChaserBorder variant="card" className="mx-auto max-w-xl">
                <div className="px-4 py-10 text-center sm:px-6 sm:py-14">
                  <Sparkles className="mx-auto h-10 w-10 text-[#F1D47A]" />
                  <h2 className="mt-4 font-prize text-2xl sm:text-3xl">
                    {data?.reason === "email_not_verified"
                      ? "Verify your email"
                      : data?.reason === "guest_account"
                        ? "Members only"
                        : "Back soon"}
                  </h2>
                  {/* The server owns the wording so the reason is never guessed at. */}
                  <p className="mt-2 text-sm text-white/50">
                    {data?.message || "The daily spin isn’t running at the moment. Check back shortly."}
                  </p>
                  {data?.reason === "email_not_verified" && (
                    <Link href="/verify-email">
                      <button className="rr-cta mt-6 inline-flex h-12 items-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.14em]">
                        Verify email
                      </button>
                    </Link>
                  )}
                  {data?.reason === "guest_account" && (
                    <Link href="/create-password">
                      <button className="rr-cta mt-6 inline-flex h-12 items-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.14em]">
                        Finish my account
                      </button>
                    </Link>
                  )}
                </div>
              </ChaserBorder>
            ) : (
              <>
                <DailySpinWheel
                  segments={data.segments}
                  landOn={landOn}
                  spinning={spinning}
                  onSettled={handleSettled}
                />

                <div className="mt-8 text-center">
                  {won !== null ? (
                    <div className="mx-auto max-w-sm rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/45">You won</p>
                      <p className="font-prize text-4xl text-[#F1D47A] sm:text-5xl">{won} pts</p>
                      <p className="mt-2 text-xs text-white/45">Added to your Ringtone Points.</p>
                    </div>
                  ) : alreadyDone ? (
                    <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-black/40 px-5 py-5">
                      <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/45">
                        <Clock className="h-3 w-3 text-[#F1D47A]" />
                        Next free spin in
                      </p>
                      <div className="mt-1">
                        <NextSpin at={data.nextSpinAt} />
                      </div>
                      {data.lastResult && (
                        <p className="mt-2 text-xs text-white/45">
                          Today you won {data.lastResult.pointsValue} points.
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      className="rr-cta inline-flex h-14 items-center justify-center rounded-xl px-12 text-base font-black uppercase tracking-[0.14em] disabled:opacity-50"
                      disabled={!canSpin}
                      onClick={() => spin.mutate()}
                      data-testid="button-daily-spin"
                    >
                      {spinning || spin.isPending ? "Spinning…" : "Spin now"}
                    </button>
                  )}

                  {won !== null && (
                    <div className="mt-5 flex flex-col items-center gap-2">
                      <p className="inline-flex items-center gap-1.5 text-xs text-white/40">
                        <Clock className="h-3.5 w-3.5 text-[#F1D47A]" />
                        Next free spin in <NextSpin at={data.nextSpinAt} />
                      </p>
                      <Link href="/">
                        <button className="rr-header-ghost mt-2 h-11 px-6 text-xs">Browse games</button>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
