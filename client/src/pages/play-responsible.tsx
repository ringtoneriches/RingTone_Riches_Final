import { Link } from "wouter";
import LegalLayout, {
  Bullets,
  MailLink,
  Note,
  RelatedLegal,
  Section,
} from "@/components/legal/LegalLayout";

const TOC = [
  { id: "intro", label: "Keep it enjoyable" },
  { id: "spending", label: "Understand your spending" },
  { id: "tips", label: "Mindful participation" },
  { id: "signs", label: "Warning signs" },
  { id: "break", label: "Take a break" },
  { id: "more", label: "Related pages" },
] as const;

export default function PlayResponsibly() {
  return (
    <LegalLayout
      badge="Well-being"
      title="PLAY RESPONSIBLY"
      sub="Competitions should stay fun, within budget, and in your control."
      toc={TOC}
    >
      <Section id="intro" kicker="Start here" title="Keeping your participation enjoyable">
        <p>
          At Ringtone Riches, we want your experience to be fun, exciting, and within your comfort zone.
          Participating in our competitions should always be positive and enjoyable. It’s important to be
          mindful of your spending and make sure participation remains something you control.
        </p>
        <Note>
          Account tools to pause play or set a spend limit live in{" "}
          <Link href="/wallet?tab=wellbeing">My Account → Well-Being</Link>. The full guide is on{" "}
          <a href="/be-aware">Be Aware</a>.
        </Note>
      </Section>

      <Section id="spending" title="Understanding your spending">
        <p>
          The first step towards responsible participation is being aware of your spending habits. Take a
          moment to consider how much you are spending on competitions and whether it aligns with your
          overall budget and priorities.
        </p>
        <Bullets
          items={[
            "Am I setting clear limits on how much I spend?",
            "Am I keeping track of my entries and associated costs?",
            "Are my competition entries taking priority over essential expenses?",
            "Am I borrowing money or using funds intended for other purposes to enter competitions?",
          ]}
        />
      </Section>

      <Section id="tips" title="Tips for mindful participation">
        <Bullets
          items={[
            "Set a budget — decide in advance how much you’re comfortable spending and stick to it.",
            "Time limits — be mindful of your time; take breaks and maintain perspective.",
            "Don’t chase losses — each competition is independent; avoid spending to recover losses.",
            "Participate for enjoyment — focus on the fun, not just winning.",
            "Be honest with yourself — regularly review your spending and habits.",
            "Talk about it — discuss concerns with trusted friends or family for perspective.",
          ]}
        />
      </Section>

      <Section id="signs" title="Recognising potential difficulties">
        <p>Be aware of signs that participation might be becoming problematic:</p>
        <Bullets
          items={[
            "Spending more money than you can comfortably afford",
            "Feeling preoccupied with competitions",
            "Lying about your participation or spending",
            "Experiencing guilt or anxiety about entries",
            "Neglecting responsibilities or relationships",
            "Trying to win back losses by entering more competitions",
          ]}
        />
      </Section>

      <Section id="break" title="Taking a break or seeking support">
        <p>
          If you feel you need time away from competitions, we offer options to help you manage your access:
        </p>
        <Bullets
          items={[
            "Temporary account blocking: contact our support team to temporarily block your account for a chosen period.",
            "Account termination: request permanent closure of your account if you prefer a longer break.",
          ]}
        />
        <p>
          Your well-being matters to us at Ringtone Riches. Participate responsibly and reach out to our
          support team at <MailLink /> if you have concerns or would like to discuss taking a break.
          The goal is to have fun and enjoy the thrill of competition responsibly.
        </p>
        <div className="mt-6">
          <Link href="/be-aware">
            <span className="rr-cta inline-flex h-12 cursor-pointer items-center justify-center rounded-xl px-7 text-sm font-black uppercase tracking-[0.12em]">
              See well-being tools
            </span>
          </Link>
        </div>
      </Section>

      <Section id="more" kicker="Also useful" title="Related pages">
        <RelatedLegal exclude="play" />
      </Section>
    </LegalLayout>
  );
}
