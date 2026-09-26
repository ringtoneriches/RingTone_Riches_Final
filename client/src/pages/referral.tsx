import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Check, Copy, Share2, Trophy, Users, Wallet, ChevronRight, Clock,
} from "lucide-react";

/**
 * The referral page.
 *
 * Built around sharing rather than around a code: a code you have to select
 * and copy is where most referral programmes quietly die. The primary action
 * is one tap into WhatsApp with the message already written.
 *
 * The second idea is progress. Each invite shows how far it has got, because
 * a half-finished invite is something the member can act on — a stalled friend
 * is worth a nudge, and nudging is the behaviour that makes this pay.
 */

type Invite = {
  id: string;
  name: string;
  joinedAt: string;
  toppedUp: boolean;
  rewardPoints: number;
  status: string;
};

type Stats = {
  signedUp: number;
  completed: number;
  pointsEarned: number;
  invites: Invite[];
  settings: {
    signupPoints: number;
    rewardPoints: number;
    minTopUp: number;
    weeklyPrizePoints: number;
  };
};

type Leaderboard = {
  weekStart: string;
  leaderboard: Array<{ position: number; name: string; referrals: number; isMe: boolean }>;
  me: { position: number | null; referrals: number };
  leaderReferrals: number;
};

/** Points are worth 1p each everywhere else on the site, so show both. */
const money = (points: number) => `£${(points / 100).toFixed(2)}`;

export default function Referral() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: codeData } = useQuery<{ referralCode: string }>({
    queryKey: ["/api/user/referral-code"],
  });
  const { data: stats } = useQuery<Stats>({ queryKey: ["/api/user/referral-stats"] });
  const { data: board } = useQuery<Leaderboard>({ queryKey: ["/api/referrals/leaderboard"] });

  const code = codeData?.referralCode ?? "";
  const link = useMemo(
    () => (code ? `${window.location.origin}/register?ref=${code}` : ""),
    [code],
  );

  const signupPoints = stats?.settings.signupPoints ?? 100;
  const rewardPoints = stats?.settings.rewardPoints ?? 300;
  const weeklyPrize = stats?.settings.weeklyPrizePoints ?? 1500;
  const minTopUp = stats?.settings.minTopUp ?? 10;

  const message = `Come and play on Ringtone Riches with me — use my link and you'll start with ${signupPoints} Ringtone Points (${money(signupPoints)}) free. ${link}`;

  const share = async () => {
    if (!link) return;
    // The native sheet is the whole point on a phone: it puts WhatsApp,
    // Messages and everything else one tap away.
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ringtone Riches", text: message, url: link });
        return;
      } catch {
        /* Cancelled — fall through to copying. */
      }
    }
    copy();
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      toast({ title: "Link copied", description: "Paste it anywhere you like." });
    } catch {
      toast({ title: "Couldn't copy", description: link, variant: "destructive" });
    }
  };

  const whatsapp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");

  const toLead = board && board.me.position !== 1 ? board.leaderReferrals - board.me.referrals + 1 : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Header />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6">
        {/* The offer, in one line, before anything else. */}
        <section className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 p-6 sm:p-9">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.16) 0%, rgba(5,5,5,0) 70%)",
            }}
          />
          <div className="relative text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1">
              <Users className="h-3.5 w-3.5 text-[#F1D47A]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F1D47A]">
                Invite &amp; earn
              </span>
            </div>

            <h1 className="font-prize text-[2rem] leading-[0.95] sm:text-5xl">
              GET {rewardPoints} POINTS
              <br />
              FOR EVERY FRIEND
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
              They get <strong className="text-[#F1D47A]">{signupPoints} Ringtone Points</strong>{" "}
              just for joining. You get <strong className="text-[#F1D47A]">{rewardPoints} Ringtone Points</strong>{" "}
              as soon as they top up{minTopUp > 0 ? ` £${minTopUp}` : ""}. Points are spent on
              site — {rewardPoints} points is worth {money(rewardPoints)} of entries.
            </p>

            {/* One tap. Everything else is secondary. */}
            <div className="mx-auto mt-7 flex max-w-sm flex-col gap-2.5">
              <Button
                onClick={share}
                className="h-14 w-full rounded-xl bg-[#F1D47A] text-base font-black uppercase tracking-[0.12em] text-[#050505] hover:bg-[#f7e2a0]"
                data-testid="button-share-referral"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share my link
              </Button>

              <div className="flex gap-2.5">
                <Button
                  onClick={whatsapp}
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-white/15 text-sm font-bold"
                  data-testid="button-share-whatsapp"
                >
                  WhatsApp
                </Button>
                <Button
                  onClick={copy}
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-white/15 text-sm font-bold"
                  data-testid="button-copy-link"
                >
                  {copied ? <Check className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>

              {code && (
                <p className="pt-1 text-center text-xs text-white/35">
                  or share your code{" "}
                  <span className="font-mono font-bold tracking-widest text-[#F1D47A]">{code}</span>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Progress, because a number you can move is what drives another share. */}
        <section className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4">
          {[
            { label: "Invited", value: String(stats?.signedUp ?? 0), icon: Users },
            { label: "Topped up", value: String(stats?.completed ?? 0), icon: Wallet },
            {
              label: "Points earned",
              value: String(stats?.pointsEarned ?? 0),
              // "worth", not a bare £, so nobody reads it as cash to withdraw.
              sub: `worth ${money(stats?.pointsEarned ?? 0)}`,
              icon: Trophy,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center">
              <s.icon className="mx-auto mb-2 h-4 w-4 text-[#D4AF37]" />
              <div className="font-prize text-2xl text-white sm:text-3xl">{s.value}</div>
              {s.sub && <div className="text-[11px] text-[#F1D47A]">{s.sub}</div>}
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* The weekly competition, with the gap to the lead spelled out. */}
        <section className="mt-5 rounded-2xl border border-[#C8102E]/30 bg-[#C8102E]/[0.06] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-prize text-xl text-white sm:text-2xl">TOP RECRUITER</h2>
              <p className="mt-1 text-sm text-white/55">
                Most friends who top up this week wins{" "}
                <strong className="text-[#F1D47A]">{weeklyPrize} points</strong> ({money(weeklyPrize)}).
              </p>
            </div>
            {board?.me.position ? (
              <div className="rounded-lg border border-[#F1D47A]/30 bg-black/40 px-3 py-2 text-center">
                <div className="font-prize text-xl text-[#F1D47A]">#{board.me.position}</div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-white/40">You</div>
              </div>
            ) : null}
          </div>

          {board?.leaderboard.length ? (
            <ol className="mt-4 space-y-1.5">
              {board.leaderboard.slice(0, 5).map((row) => (
                <li
                  key={row.position}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    row.isMe ? "border border-[#F1D47A]/35 bg-[#F1D47A]/10" : "bg-white/[0.03]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-5 font-prize text-[#D4AF37]">{row.position}</span>
                    <span className={row.isMe ? "font-bold text-white" : "text-white/70"}>
                      {row.isMe ? "You" : row.name}
                    </span>
                  </span>
                  <span className="font-bold text-white/80">{row.referrals}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-white/40">
              Nobody has qualified yet this week — one referral takes the lead.
            </p>
          )}

          {toLead > 0 && board?.leaderboard.length ? (
            <p className="mt-3 text-center text-xs font-bold text-[#F1D47A]">
              {toLead} more {toLead === 1 ? "friend" : "friends"} to take the lead
            </p>
          ) : null}
        </section>

        {/* Each invite and how far it has got. */}
        <section className="mt-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-white/50">
            Your invites
          </h2>

          {!stats?.invites.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-white/15" />
              <p className="text-sm text-white/45">
                No invites yet. Share your link and they&rsquo;ll appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {stats.invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  data-testid={`invite-${invite.id}`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{invite.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                      {invite.toppedUp ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          Topped up — you earned {invite.rewardPoints} points
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-amber-400" />
                          Signed up — {rewardPoints} points when they top up
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                      invite.toppedUp
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {invite.toppedUp ? "Paid" : "Waiting"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link href="/wallet">
          <a className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white/70 transition-colors hover:border-white/20">
            See your points balance
            <ChevronRight className="h-4 w-4" />
          </a>
        </Link>
      </main>

      <Footer />
    </div>
  );
}
