import { Link } from "wouter";
import LegalLayout, {
  Bullets,
  MailLink,
  Note,
  RelatedLegal,
  Section,
} from "@/components/legal/LegalLayout";

const TOC = [
  { id: "intro", label: "Stay in control" },
  { id: "tools", label: "Well-being tools" },
  { id: "spending", label: "Be aware of spending" },
  { id: "tips", label: "Tips" },
  { id: "signs", label: "Warning signs" },
  { id: "break", label: "Take a break" },
  { id: "support", label: "Extra support" },
  { id: "more", label: "Related pages" },
] as const;

export default function BeAware() {
  return (
    <LegalLayout
      badge="Well-being"
      title="BE AWARE"
      sub="Treat competitions as entertainment. Use the tools in your account if you need to slow down."
      toc={TOC}
    >
      <Section id="intro" kicker="Start here" title="Keeping it fun and in your control">
        <p>
          At Ringtone Riches, we want every part of your experience to be exciting, enjoyable and within
          your comfort zone. Competitions should always add a bit of fun to your day — never stress or
          financial pressure.
        </p>
        <p>
          We encourage all players to take part responsibly and to treat our games as entertainment, not
          a way to make money. By staying mindful of your spending and using the tools in your account,
          you can keep your Ringtone Riches experience positive.
        </p>
        <Note>
          Please only ever play with money you can afford to lose. Competitions are designed for
          entertainment only.
        </Note>
      </Section>

      <Section id="tools" title="Your well-being tools">
        <p>
          You’ll find a dedicated Well-Being section in My Account with controls to help you stay in charge:
        </p>
        <Bullets
          items={[
            "Daily spending limit: set a maximum amount you’re happy to spend in any 24-hour period.",
            "Real-time spend view: see at a glance how much you’ve spent today and how much remains within your limit.",
            "Temporary suspension (“Take a Break”): choose a suspension period from 1 day up to 365 days. During this time you won’t be able to log in, top up, or enter any competitions.",
            "Permanent account closure: permanently close your account yourself if you feel you need to step away for good. This will remove access to your account, wallet balance, Ringtone Points, referral rewards and order history.",
          ]}
        />
        <p>
          You can access all of these by logging in and going to <strong>My Account → Well-Being</strong>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/wallet?tab=wellbeing">
            <span className="rr-cta inline-flex h-12 cursor-pointer items-center justify-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.12em]">
              Open well-being tools
            </span>
          </Link>
        </div>
        <p>
          If you ever need help using these tools, our support team is available at <MailLink />.
        </p>
      </Section>

      <Section id="spending" title="Be aware of your spending">
        <p>
          It’s important that any money you spend here fits comfortably within your overall budget. Ask
          yourself:
        </p>
        <Bullets
          items={[
            "Have I set a clear weekly or monthly limit for myself?",
            "Am I tracking roughly how much I’ve spent over time?",
            "Are competition entries ever taking priority over essential bills or commitments?",
            "Am I ever tempted to use money meant for something else?",
          ]}
        />
        <p>
          If any of these make you pause, it might be a good time to use the Daily Spending Limit or take
          a short break using the Temporary Suspension option.
        </p>
      </Section>

      <Section id="tips" title="Tips for staying in control">
        <p>To help you keep your participation healthy and enjoyable:</p>
        <Bullets
          items={[
            "Set a spending limit: decide how much you can comfortably afford to spend and stick to that amount — whether it is weekly or monthly.",
            "Take breaks: don’t spend too long browsing or entering competitions in one sitting. Taking breaks helps keep your perspective fresh.",
            "Avoid chasing wins or losses: each draw is independent — entering more to make up for earlier results often leads to overspending.",
            "Play for fun: focus on the excitement and entertainment of taking part, not just the outcome.",
            "Review regularly: check in on your activity every so often to make sure you are still within your limits.",
            "Talk about it: if you are worried about how much time or money you are spending, talk to someone you trust — a friend, family member, or our support team.",
          ]}
        />
      </Section>

      <Section id="signs" title="Recognising when it might be a problem">
        <p>
          It’s important to know the signs that participation could be becoming unhealthy. You might notice:
        </p>
        <Bullets
          items={[
            "Spending more than you can comfortably afford.",
            "Thinking about competitions constantly or feeling pressure to enter.",
            "Hiding how much you are spending from others.",
            "Feeling anxious, guilty, or frustrated after entering.",
            "Neglecting other priorities or relationships.",
            "Trying to win back losses by entering more competitions.",
          ]}
        />
        <p>
          If any of this sounds familiar, please take a step back and consider using our Well-Being tools
          or seeking help. You can set a low spend limit, use Temporary Suspension, or close your account.
        </p>
      </Section>

      <Section id="break" title="Taking a break or getting support">
        <p>
          We understand that sometimes you may want to pause your participation for a while. Ringtone
          Riches provides options to help you do that:
        </p>
        <Bullets
          items={[
            "Temporary suspension: you can suspend your account for 1–365 days directly from the Well-Being page. During that time, you will not be able to log in, top up, or enter any competitions.",
            "Account closure: if you feel a longer break is needed, you can permanently close your account yourself from the Well-Being page.",
          ]}
        />
        <p>
          Your well-being always comes first at Ringtone Riches. If you ever feel your participation is
          getting out of hand, please reach out — we are here to help you stay in control and keep things
          fun. Remember, competitions should always be an enjoyable form of entertainment, not a source of
          stress.
        </p>
      </Section>

      <Section id="support" title="Need extra support?">
        <p>If you ever feel your play is no longer fun, we strongly encourage you to:</p>
        <Bullets
          items={[
            "Use the tools in the Well-Being section of your account; and",
            "Reach out for independent advice or support with money worries or emotional well-being (for example through free UK advice services or helplines).",
          ]}
        />
        <p>
          Your well-being always comes first at Ringtone Riches. Our competitions are designed for
          entertainment only — please only ever play with money you can afford to lose.
        </p>
        <p>
          Support: <MailLink />
        </p>
      </Section>

      <Section id="more" kicker="Also useful" title="Related pages">
        <RelatedLegal exclude="aware" />
      </Section>
    </LegalLayout>
  );
}
