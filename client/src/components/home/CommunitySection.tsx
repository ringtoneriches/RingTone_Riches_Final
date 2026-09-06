import { useEffect, useState } from "react";
import { Facebook, Users, Trophy, Sparkles, MessageCircle } from "lucide-react";

const PERKS = [
  {
    Icon: Trophy,
    title: "Winner drops",
    body: "See who just cashed in — as it happens.",
  },
  {
    Icon: Sparkles,
    title: "Next prizes first",
    body: "New competitions land here before they get noisy.",
  },
  {
    Icon: MessageCircle,
    title: "Player chat",
    body: "Talk to people who are actually in the games.",
  },
] as const;

export default function CommunitySection() {
  const [memberCount, setMemberCount] = useState("10.3K");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/facebook-members")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.totalMembers >= 10000) {
          const formatted =
            data.totalMembers >= 1000
              ? `${(data.totalMembers / 1000).toFixed(1)}K`
              : String(data.totalMembers);
          setMemberCount(formatted);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleJoin = () => {
    window.open(
      "https://www.facebook.com/groups/1358608295902979/",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section className="relative py-12 sm:py-20 rr-section-defer" data-testid="section-community">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
              The inner circle
            </span>
          </div>
          <h2 className="font-prize text-[2rem] sm:text-5xl text-white">JOIN THE COMMUNITY</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-white/50">
            Draws, drops, and the next prize — posted where the players actually are.
          </p>
        </div>

        <div className="rr-community-panel">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F1D47A]">
                Ringtone Riches Facebook group
              </p>
              <h3 className="mt-2 font-prize text-3xl sm:text-4xl leading-none text-white">
                Sit with the winners.
              </h3>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55">
                Winner shout-outs, exclusive updates, upcoming competitions, and live talk.
                If you’re in the games, this is the room.
              </p>

              {memberCount && (
                <div className="rr-community-stat mt-6">
                  <Users className="h-5 w-5 text-[#F1D47A]" />
                  <div>
                    <p className="font-prize text-3xl leading-none text-white">{memberCount}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                      members in the group
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleJoin}
                className="rr-cta mt-7 inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-7 text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.16em] whitespace-nowrap"
                data-testid="button-join-facebook"
              >
                <Facebook className="h-4 w-4" />
                Join the Facebook group
              </button>
            </div>

            <div className="grid gap-3">
              {PERKS.map((perk) => (
                <div key={perk.title} className="rr-community-perk">
                  <span className="rr-community-perk-icon" aria-hidden>
                    <perk.Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.16em] text-white">
                      {perk.title}
                    </p>
                    <p className="mt-1 text-sm text-white/50">{perk.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
