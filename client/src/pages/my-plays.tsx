import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import ChaserBorder from "@/components/home/ChaserBorder";
import { useAuth } from "@/hooks/useAuth";
import { gameTypeLabel, playPath } from "@/lib/play-paths";
import { getFallbackImage } from "@/lib/competition-display";
import {
  isPlayExpired,
  playWindowMs,
  readyToPlayOrders,
  remainingForOrder,
  type UnplayedOrder,
} from "@/lib/unplayed-orders";
import { Clock, Gamepad2, Play, ShoppingBag } from "lucide-react";
import BrandWait from "@/components/brand/BrandWait";

function formatWindow(ms: number) {
  if (ms <= 0) return null;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function MyPlaysPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: orders = [], isLoading } = useQuery<UnplayedOrder[]>({
    queryKey: ["/api/user/orders"],
    enabled: isAuthenticated,
  });

  const ready = readyToPlayOrders(orders);
  const live = ready.filter((order) => !isPlayExpired(order));
  const expired = ready.filter((order) => isPlayExpired(order));
  const remainingTickets = live.reduce((sum, order) => sum + remainingForOrder(order), 0);

  return (
    <div className="rr-plays rr-page min-h-screen overflow-x-clip bg-[#050505] text-white">
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
        <Header />

        <section className="px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">Ready when you are</p>
                <h1 className="mt-2 font-prize text-[2.15rem] leading-none text-white sm:text-5xl lg:text-6xl">MY PLAYS</h1>
                <p className="mt-3 text-sm text-white/50 sm:text-base">
                  Every game you’ve bought and haven’t finished lives here. Orders and wallet history stay where they were.
                </p>
              </div>
              {isAuthenticated && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-3.5 py-2.5 sm:flex-none sm:px-5 sm:py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Waiting</p>
                    <p className="font-prize text-2xl text-[#F1D47A] sm:text-3xl">{live.length}</p>
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 sm:flex-none sm:px-5 sm:py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Plays left</p>
                    <p className="font-prize text-2xl text-white sm:text-3xl">{remainingTickets}</p>
                  </div>
                </div>
              )}
            </div>

            {!isAuthenticated && !authLoading ? (
              <ChaserBorder variant="card" className="max-w-xl">
                <div className="px-4 py-10 text-center sm:px-6 sm:py-14">
                  <Gamepad2 className="mx-auto h-10 w-10 text-[#F1D47A]" />
                  <h2 className="mt-4 font-prize text-2xl sm:text-3xl">Sign in to play</h2>
                  <p className="mt-2 text-sm text-white/50">Your bought games show up here after you log in.</p>
                  <Link href="/login">
                    <button className="rr-cta mt-6 inline-flex h-12 items-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.14em]">
                      Login
                    </button>
                  </Link>
                </div>
              </ChaserBorder>
            ) : isLoading || authLoading ? (
              <BrandWait
                mode="embed"
                kicker="My Plays"
                headline="Loading plays"
                subtitle="Finding games you’ve already paid for."
              />
            ) : live.length === 0 && expired.length === 0 ? (
              <ChaserBorder variant="card" className="max-w-xl">
                <div className="flex flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-14">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                    <Gamepad2 className="h-7 w-7 text-[#F1D47A]" />
                  </div>
                  <h2 className="font-prize text-2xl sm:text-3xl">Nothing waiting</h2>
                  <p className="mt-3 max-w-sm text-sm text-white/50">
                    Buy a game with ENTER NOW, or fill your cart and pay once. Finished plays stay in Orders.
                  </p>
                  <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
                    <Link href="/" className="w-full sm:w-auto">
                      <button className="rr-cta inline-flex h-12 w-full items-center justify-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.14em] sm:w-auto">
                        Browse games
                      </button>
                    </Link>
                    <Link href="/basket" className="w-full sm:w-auto">
                      <button className="rr-header-ghost h-12 w-full px-6 text-xs sm:w-auto">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        View cart
                      </button>
                    </Link>
                  </div>
                </div>
              </ChaserBorder>
            ) : (
              <>
                {live.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {live.map((order) => {
                      const type = order.competitions?.type || "";
                      const remaining = remainingForOrder(order);
                      const windowLabel = isPlayExpired(order) ? null : formatWindow(playWindowMs(order));
                      const href = playPath(type, order.orders.competitionId, order.orders.id);
                      return (
                        <ChaserBorder key={order.orders.id} variant="card">
                          <article className="flex h-full flex-col p-3.5 sm:p-4">
                            <div className="relative mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:mb-4">
                              <img
                                src={order.competitions?.imageUrl || getFallbackImage(type)}
                                alt=""
                                className="h-36 w-full object-cover sm:h-40"
                              />
                              <span className="absolute left-2.5 top-2.5 rounded-full border border-[#D4AF37]/40 bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#F1D47A]">
                                {gameTypeLabel(type)}
                              </span>
                            </div>
                            <h3 className="line-clamp-2 font-prize text-xl leading-tight text-white sm:text-2xl">
                              {order.competitions?.title || "Game"}
                            </h3>
                            <div className="mt-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-3 py-3">
                              <div className="flex items-center justify-between gap-2 text-xs text-white/45">
                                <span className="shrink-0">Plays left</span>
                                <span className="font-prize text-xl text-[#F1D47A] sm:text-2xl">
                                  {remaining}/{order.orders.quantity}
                                </span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full bg-gradient-to-r from-[#C8102E] to-[#F1D47A]"
                                  style={{ width: `${(remaining / Math.max(1, order.orders.quantity)) * 100}%` }}
                                />
                              </div>
                            </div>
                            {windowLabel && (
                              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/45">
                                <Clock className="h-3.5 w-3.5 text-[#F1D47A]" />
                                {windowLabel}
                              </p>
                            )}
                            <Link href={href} className="mt-auto pt-4">
                              <button className="rr-cta flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-[0.14em]">
                                <Play className="h-4 w-4" />
                                Play now
                              </button>
                            </Link>
                          </article>
                        </ChaserBorder>
                      );
                    })}
                  </div>
                )}

                {expired.length > 0 && (
                  <div className="mt-10">
                    <h2 className="mb-4 font-prize text-2xl text-white/70">Window closed</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {expired.map((order) => (
                        <div
                          key={order.orders.id}
                          className="rounded-2xl border border-[#FF263D]/20 bg-black/40 p-4 opacity-70"
                        >
                          <p className="font-prize text-xl text-white">{order.competitions?.title || "Game"}</p>
                          <p className="mt-2 text-xs uppercase tracking-widest text-[#FF263D]">Expired — cannot resume</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
