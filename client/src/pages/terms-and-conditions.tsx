import { type ReactNode, useEffect, useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";

const SUPPORT = "support@ringtoneriches.co.uk";
const SITE = "https://www.ringtoneriches.co.uk";
const LAST_UPDATED = "20 August 2026";

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "definitions", label: "1. Definitions" },
  { id: "competition-types", label: "2. Competition Types & Legal Structure" },
  { id: "eligibility", label: "3. Eligibility" },
  { id: "accounts", label: "4. Accounts, Guest Entry & Security" },
  { id: "paid-entry", label: "5. Entry Confirmation & Paid Entry Route" },
  { id: "postal-entry", label: "6. Free Postal Entry Route" },
  { id: "duration", label: "7. Competition Duration, Closing Dates & Extensions" },
  { id: "draw-winners", label: "8. Selecting Winners – Draw-Based Competitions" },
  { id: "prizes", label: "9. Prizes" },
  { id: "validation", label: "10. Prize Validation & Payment" },
  { id: "instant-win", label: "11. Instant Win Competitions & Instant Reveal Features" },
  { id: "technical-faults", label: "12. Technical Faults, Errors & Result Validation" },
  { id: "claims", label: "13. Winners, Contact Details & Prize Claims" },
  { id: "delivery", label: "14. Prize Storage & Delivery" },
  { id: "publicity", label: "15. Winner Information & Publicity" },
  { id: "points", label: "16. Ringtone Points, Wallet Credit & Promotional Credit" },
  { id: "protections", label: "17. Player Protections & Account Controls" },
  { id: "aml", label: "18. Anti-Money Laundering, Identity & Payment Checks" },
  { id: "chargebacks", label: "19. Payment Disputes & Chargebacks" },
  { id: "data", label: "20. Data Protection" },
  { id: "marketing", label: "21. Text Message & Marketing Communications" },
  { id: "fraud", label: "22. Fraud, Abuse & Misuse" },
  { id: "refunds", label: "23. Refunds" },
  { id: "liability", label: "24. Liability" },
  { id: "electronic", label: "25. Electronic Communications & Platform Operation" },
  { id: "availability", label: "26. Website Availability" },
  { id: "acceptable-use", label: "27. Acceptable Use" },
  { id: "ip", label: "28. Intellectual Property" },
  { id: "third-party", label: "29. External Websites & Third-Party Services" },
  { id: "platforms", label: "30. Meta, Apple & Google Disclaimer" },
  { id: "fair-admin", label: "31. Fair Administration of Competitions" },
  { id: "cancellation", label: "32. Suspension or Cancellation of a Competition" },
  { id: "assignment", label: "33. Business Transfer & Assignment" },
  { id: "third-party-rights", label: "34. Third-Party Rights" },
  { id: "complaints", label: "35. Complaints" },
  { id: "changes", label: "36. Changes to These Terms" },
  { id: "general", label: "37. General" },
  { id: "governing-law", label: "38. Governing Law" },
] as const;

const TOC_IDS = TOC.map((item) => item.id);

function useActiveSection(ids: readonly string[]) {
  const [activeId, setActiveId] = useState(ids[0] ?? "");

  useEffect(() => {
    const headerOffset = 110;

    const update = () => {
      const nearBottom =
        document.documentElement.scrollHeight - (window.scrollY + window.innerHeight) < 80;
      if (nearBottom) {
        setActiveId(ids[ids.length - 1] ?? "");
        return;
      }

      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - headerOffset <= 8) {
          current = id;
        }
      }
      setActiveId(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("hashchange", update);
    };
  }, [ids]);

  useEffect(() => {
    const link = document.querySelector<HTMLElement>(`.rr-legal-toc [data-toc-id="${activeId}"]`);
    const nav = link?.closest(".rr-legal-toc");
    if (!link || !nav) return;

    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;
    const viewTop = nav.scrollTop;
    const viewBottom = viewTop + nav.clientHeight;
    if (top < viewTop + 16) {
      nav.scrollTop = Math.max(0, top - 16);
    } else if (bottom > viewBottom - 16) {
      nav.scrollTop = bottom - nav.clientHeight + 16;
    }
  }, [activeId]);

  return activeId;
}

function MailLink() {
  return (
    <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>
  );
}

function SiteLink() {
  return (
    <a href={SITE} target="_blank" rel="noopener noreferrer">
      www.ringtoneriches.co.uk
    </a>
  );
}

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="rr-legal-section">
      {kicker ? <span className="rr-legal-kicker">{kicker}</span> : null}
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="rr-legal-bullets">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Ordered({ items }: { items: ReactNode[] }) {
  return (
    <ol className="rr-legal-ol">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <aside className="rr-legal-note">{children}</aside>;
}

function Toc({ activeId }: { activeId: string }) {
  return (
    <nav className="rr-legal-toc" aria-label="On this page">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#F1D47A]">
        On this page
      </p>
      {TOC.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          data-toc-id={item.id}
          className={activeId === item.id ? "is-active" : undefined}
          aria-current={activeId === item.id ? "location" : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export default function TermsAndConditions() {
  const activeId = useActiveSection(TOC_IDS);

  return (
    <div className="min-h-screen text-foreground relative overflow-x-clip" style={{ backgroundColor: "#050505" }}>
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <header className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF263D]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                Legal
              </span>
            </div>
            <h1 className="font-prize text-[2.15rem] leading-[0.92] text-white sm:text-6xl">
              TERMS & CONDITIONS
            </h1>
            <p className="mt-4 text-sm text-white/50 sm:text-base">
              The rules for entering Ringtone Riches competitions, claiming prizes, and using the Website.
            </p>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <details className="rr-legal-jump mt-8 lg:hidden">
            <summary>Jump to a section</summary>
            <div className="mt-3 grid gap-1 px-1 pb-2">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block py-1.5 text-sm hover:text-[#F1D47A] ${
                    activeId === item.id ? "font-semibold text-[#F1D47A]" : "text-white/55"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </details>

          <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-14">
            <aside className="hidden lg:block lg:sticky lg:top-[5.5rem] lg:self-start">
              <Toc activeId={activeId} />
            </aside>

            <article className="rr-legal-prose max-w-3xl">
              <Section id="introduction" kicker="Start here" title="Introduction">
                <p>
                  Ringtone Riches (“Ringtone Riches”, “we”, “us”, “our”) is a promoter of prize competitions which allocate prizes in accordance with these Terms & Conditions (“Terms”) on:
                </p>
                <p>
                  <SiteLink />
                </p>
                <div className="rr-legal-panel">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
                    Registered address
                  </p>
                  <p className="mb-0">
                    1 West Havelock Street<br />
                    South Shields<br />
                    Tyne & Wear<br />
                    United Kingdom<br />
                    NE33 5AF
                  </p>
                  <p className="mt-3 mb-0">
                    Email: <MailLink />
                  </p>
                </div>
                <p>
                  Ringtone Riches may operate multiple competitions, draws, instant-win competitions and promotional games at any one time.
                </p>
                <p>
                  These Terms, together with our{" "}
                  <a href="/privacy-policy">Privacy Policy</a>,{" "}
                  <a href="/privacy-policy">Cookie Policy</a> and the specific information displayed on the relevant Competition page (“Competition Details”), form the agreement between Ringtone Riches and each Entrant.
                </p>
                <p>If there is any conflict between these documents, they shall apply in the following order:</p>
                <Ordered
                  items={[
                    "the applicable Competition Details;",
                    "these Terms;",
                    "the Privacy Policy and Cookie Policy.",
                  ]}
                />
                <p>
                  By creating an account, entering a Competition, purchasing an Entry, using an Instant-Win Feature or otherwise using the Website, you agree to be bound by these Terms.
                </p>
              </Section>

              <Section id="definitions" kicker="Section 1" title="Definitions">
                <p>In these Terms:</p>
                <p>“Promoter” means Ringtone Riches.</p>
                <p>“Website” means www.ringtoneriches.co.uk.</p>
                <p>“Competition” means any prize competition, prize draw, instant-win competition, instant-reveal promotion or other prize promotion operated by Ringtone Riches.</p>
                <p>“Competition Details” means the specific information and rules displayed on the relevant Competition page, including where applicable the Prize, Entry price, ticket allocation, opening date, Closing Date, maximum Entries and other significant conditions.</p>
                <p>“Entrant” or “Player” means any person who validly enters a Competition.</p>
                <p>“Ticket” or “Entry” means a valid paid or qualifying free Entry into a Competition.</p>
                <p>“Instant Win Competition” means a Competition in which an Entrant may know immediately, or as soon as reasonably practicable, whether an Entry has won an instant Prize.</p>
                <p>“Instant-Win Feature” means any wheel, spin, scratch card, balloon, vault, reel or other interactive reveal mechanic offered by Ringtone Riches.</p>
                <p>“Ringtone Points” means Website credit which may be used for eligible activities in accordance with these Terms.</p>
                <p>“Prize” means any cash prize, product, holiday, site credit or other reward offered in connection with a Competition.</p>
              </Section>

              <Section id="competition-types" kicker="Section 2" title="Competition Types & Legal Structure">
                <p>2.1 Ringtone Riches may operate different forms of prize promotion, including:</p>
                <Bullets
                  items={[
                    "Draw-Based Competitions;",
                    "Instant Win Competitions;",
                    "Instant Reveal Promotions; and",
                    "skill-based prize competitions where expressly stated.",
                  ]}
                />
                <p>2.2 Multiple Competitions may operate simultaneously.</p>
                <p>2.3 The applicable Competition Details will explain the relevant Entry method, Prize information and significant conditions for that particular Competition.</p>
                <p>2.4 Availability, Entry pricing, maximum ticket allocation and Entry limits will be displayed on the relevant Competition page.</p>
                <p>2.5 Where a Competition operates using both a paid Entry route and a qualifying free Entry route, the free Entry route will be administered in accordance with applicable law.</p>
                <p>2.6 Where a Competition is expressly operated as a skill-based prize competition, any applicable skill, knowledge or judgement requirement will be displayed in the Competition Details.</p>
                <p>2.7 Competitions are provided for entertainment purposes.</p>
                <p>Participation must not be treated as:</p>
                <Bullets
                  items={[
                    "an investment;",
                    "a guaranteed way of making money;",
                    "an alternative to employment; or",
                    "a means of resolving financial difficulty.",
                  ]}
                />
                <Note>
                  The Gambling Commission currently distinguishes between genuine prize competitions and paid/free draws. For paid/free draws, the free route must be properly promoted, no less convenient and treated equally by the prize-allocation system.
                </Note>
              </Section>

              <Section id="eligibility" kicker="Section 3" title="Eligibility">
                <p>3.1 Unless otherwise stated in the Competition Details, Competitions are open to persons:</p>
                <Bullets
                  items={[
                    "aged 18 years or over;",
                    "legally entitled to enter from their place of residence; and",
                    "capable of entering into a binding contract.",
                  ]}
                />
                <p>3.2 Ringtone Riches currently accepts eligible Entrants from the United Kingdom and, where specifically offered, the Republic of Ireland.</p>
                <p>3.3 Competitions are not open to:</p>
                <Bullets
                  items={[
                    "anyone under the age of 18;",
                    "employees of Ringtone Riches;",
                    "agents, developers, contractors or suppliers directly involved in administering the relevant Competition;",
                    "anyone professionally connected with winner selection or verification; or",
                    "immediate household members of any person excluded above where participation would create a conflict of interest.",
                  ]}
                />
                <p>3.4 By entering, you confirm that:</p>
                <Bullets
                  items={[
                    "you satisfy all applicable eligibility requirements;",
                    "the information supplied by you is true, accurate and complete;",
                    "you have read and accepted these Terms; and",
                    "you are legally entitled to participate.",
                  ]}
                />
                <p>3.5 It is the Entrant’s responsibility to ensure that participation in a Competition is lawful from their country or jurisdiction of residence.</p>
                <p>3.6 Ringtone Riches may require reasonable proof of:</p>
                <Bullets
                  items={[
                    "age;",
                    "identity;",
                    "address;",
                    "payment-method ownership;",
                    "bank-account ownership; and",
                    "any other information reasonably required to verify eligibility or prevent fraud.",
                  ]}
                />
                <p>3.7 Failure to provide requested information within a reasonable period may result in the relevant Entry or Prize claim being suspended or declared invalid where reasonably necessary.</p>
              </Section>

              <Section id="accounts" kicker="Section 4" title="Accounts, Guest Entry & Security">
                <p>4.1 Entrants may be required to create an account using accurate and current information.</p>
                <p>4.2 Where Guest Checkout is available, Entrants may be permitted to enter without first creating an account.</p>
                <p>4.3 Guest Entrants must provide the information reasonably required to process the Entry, identify the Entrant and contact them where necessary.</p>
                <p>4.4 You are responsible for:</p>
                <Bullets
                  items={[
                    "keeping your login credentials secure;",
                    "preventing unauthorised access to your account;",
                    "using a strong password;",
                    "ensuring information supplied to Ringtone Riches remains accurate and up to date; and",
                    "promptly notifying us if you suspect unauthorised account activity.",
                  ]}
                />
                <p>4.5 You must not:</p>
                <Bullets
                  items={[
                    "share an account for joint play;",
                    "operate multiple accounts to circumvent limits;",
                    "impersonate another person;",
                    "disclose your login details to another person; or",
                    "knowingly permit another person to use your account contrary to these Terms.",
                  ]}
                />
                <p>4.6 Entrants should log out of their account when it is not in use, particularly when accessing the Website from shared or public devices.</p>
                <p>4.7 Ringtone Riches may temporarily suspend an account while investigating suspected security, fraud, payment or eligibility issues.</p>
                <p>4.8 Ringtone Riches will not normally be responsible for losses resulting from unauthorised account use where the Entrant failed to take reasonable steps to protect their account credentials.</p>
              </Section>

              <Section id="paid-entry" kicker="Section 5" title="Entry Confirmation & Paid Entry Route">
                <p>5.1 To enter through the paid route, an Entrant must:</p>
                <Bullets
                  items={[
                    "visit the relevant Competition page;",
                    "select the desired number of Entries or plays;",
                    "complete any Competition Question where applicable;",
                    "provide the required information;",
                    "complete checkout; and",
                    "successfully complete payment.",
                  ]}
                />
                <p>5.2 Each valid Entry may be allocated one or more unique ticket numbers in accordance with the relevant Competition Details.</p>
                <p>5.3 Payment for an Entry does not guarantee that the Entrant will win a Prize.</p>
                <p>5.4 An Entrant will not be treated as having successfully entered a Competition until the Entry has been recorded and confirmed by Ringtone Riches.</p>
                <p>Confirmation may be provided:</p>
                <Bullets
                  items={[
                    "within the Entrant’s account;",
                    "within a Guest Entry record;",
                    "on an order-confirmation page; or",
                    "by email or another electronic confirmation.",
                  ]}
                />
                <p>5.5 A payment authorisation by a bank or payment provider does not, by itself, establish that a valid Competition Entry was successfully created.</p>
                <p>5.6 Where payment is successfully taken but a corresponding valid Entry is not generated because of a genuine technical failure, Ringtone Riches will investigate and provide an appropriate remedy.</p>
                <p>5.7 Where payment fails, is reversed or cannot be completed, Ringtone Riches is not obliged to allocate the corresponding paid Entry.</p>
                <p>5.8 Entries are generally final once successfully processed.</p>
                <p>Refunds may be provided where:</p>
                <Bullets
                  items={[
                    "a Competition is cancelled;",
                    "a duplicate payment is confirmed;",
                    "payment is taken but no valid Entry is created;",
                    "an Entry is received after the Competition has closed and cannot be included; or",
                    "a refund is otherwise required by law.",
                  ]}
                />
              </Section>

              <Section id="postal-entry" kicker="Section 6" title="Free Postal Entry Route">
                <p>6.1 Where a qualifying free Entry route is offered, Entrants may enter by standard first or second class post.</p>
                <p>6.2 Postal entries must be sent to:</p>
                <div className="rr-legal-panel">
                  <p className="mb-0">
                    Ringtone Riches<br />
                    1 West Havelock Street<br />
                    South Shields<br />
                    Tyne & Wear<br />
                    NE33 5AF
                  </p>
                </div>
                <p>6.3 Each postal Entry must clearly include:</p>
                <Bullets
                  items={[
                    "the Entrant’s full name;",
                    "full postal address;",
                    "date of birth;",
                    "telephone number;",
                    "email address;",
                    "exact Competition name; and",
                    "any Competition Question answer or other information required by the applicable Competition Details.",
                  ]}
                />
                <p>6.4 Each free Entry must be submitted separately.</p>
                <p>6.5 Multiple Entries contained within one envelope will not be treated as multiple separate Entries unless expressly permitted.</p>
                <p>6.6 Postal entries must:</p>
                <Bullets
                  items={[
                    "use valid first or second class postage;",
                    "be complete and legible;",
                    "comply with applicable Entry limits; and",
                    "be received before the relevant Competition closes.",
                  ]}
                />
                <p>6.7 Hand-delivered Entries will not be accepted.</p>
                <p>6.8 Recorded delivery and special delivery will not be accepted where the free Entry route specifies standard post.</p>
                <p>6.9 Where an account is required to process a postal Entry, the information supplied by post must correspond with the Entrant’s registered account details.</p>
                <p>6.10 Valid qualifying free Entries will be treated in the same manner as corresponding paid Entries for winner and Prize allocation purposes.</p>
                <p>6.11 The system determining Prizes will not distinguish between qualifying paid and free Entries solely because of the route used to enter.</p>
                <p>6.12 Postal Entries received after a Competition has sold out or closed cannot be processed for that Competition.</p>
                <p>6.13 Postal Entries may be subject to the same maximum Entry limit as paid Entries for the relevant Competition.</p>
                <Note>
                  The free route is an important legal part of a paid/free draw and must work in practice as described, not merely appear in the Terms.
                </Note>
              </Section>

              <Section id="duration" kicker="Section 7" title="Competition Duration, Closing Dates & Extensions">
                <p>7.1 Each Competition will have an Opening Date and Closing Date displayed in the applicable Competition Details.</p>
                <p>7.2 Unless otherwise stated, a Competition may close when either:</p>
                <Bullets
                  items={[
                    "the maximum number of Entries has been received; or",
                    "the published Closing Date is reached,",
                  ]}
                />
                <p>whichever occurs first.</p>
                <p>7.3 Ringtone Riches will not normally extend or shorten a Competition simply because ticket sales are lower than expected.</p>
                <p>7.4 If it becomes reasonably necessary due to exceptional circumstances beyond the control of Ringtone Riches, the Promoter may extend or otherwise amend the Closing Date of a Competition.</p>
                <p>Such circumstances may include, but are not limited to:</p>
                <Bullets
                  items={[
                    "major technical failures;",
                    "security incidents;",
                    "payment-system disruption;",
                    "telecommunications or internet failures;",
                    "power or infrastructure failures;",
                    "legal or regulatory requirements;",
                    "acts or orders of government;",
                    "industrial disruption;",
                    "severe weather or natural disasters;",
                    "civil disturbance;",
                    "terrorism;",
                    "war;",
                    "force majeure events; or",
                    "another exceptional circumstance where continuing under the original Closing Date would be unfair, impracticable or contrary to law.",
                  ]}
                />
                <p>7.5 Any revised Closing Date will be clearly displayed on the Website and, where appropriate, communicated through Ringtone Riches’ official channels.</p>
                <p>7.6 Ringtone Riches may temporarily suspend a Competition while investigating a serious technical, security, legal or operational issue.</p>
                <p>7.7 Where a Competition must be cancelled, paid Entrants will receive an appropriate refund or other remedy required by law.</p>
                <p>7.8 Ringtone Riches will not materially alter the rules of an existing Competition where doing so would unfairly disadvantage Entrants who have already entered.</p>
              </Section>

              <Section id="draw-winners" kicker="Section 8" title="Selecting Winners – Draw-Based Competitions">
                <p>8.1 Winners of Draw-Based Competitions will be selected from eligible Entries using a fair and verifiably random process.</p>
                <p>8.2 Each valid Entry may be associated with a unique ticket number.</p>
                <p>8.3 Winner selection may be carried out using:</p>
                <Bullets
                  items={[
                    "a verifiably random computer process;",
                    "an independently supervised random process; or",
                    "another fair and verifiable method specified in the Competition Details.",
                  ]}
                />
                <p>8.4 Where a draw is conducted live, Ringtone Riches may broadcast it through Facebook, the Website or another suitable platform.</p>
                <p>8.5 The draw date, time and relevant information may be communicated through the Website and/or Ringtone Riches’ official social-media channels.</p>
                <p>8.6 Where an unsold or otherwise ineligible ticket number is selected in a Competition in which only sold or valid Entries are eligible, another selection may be made until an eligible ticket is produced.</p>
                <p>8.7 Ringtone Riches may retain:</p>
                <Bullets
                  items={[
                    "Entry lists;",
                    "ticket records;",
                    "draw records;",
                    "audit logs; and",
                    "other information reasonably necessary to demonstrate that a valid and fair winner selection took place.",
                  ]}
                />
                <p>8.8 The number of winners will be as specified in the applicable Competition Details.</p>
                <Note>
                  CAP requires prize draws to use a verifiably random computer process or independent selection/supervision where applicable.
                </Note>
              </Section>

              <Section id="prizes" kicker="Section 9" title="Prizes">
                <p>9.1 The Prize or Prizes available in each Competition will be described in the applicable Competition Details.</p>
                <p>9.2 Prize descriptions are supplied in good faith based on information reasonably available to Ringtone Riches at the time.</p>
                <p>9.3 Unless expressly stated otherwise:</p>
                <Bullets
                  items={[
                    "Prizes are non-transferable; and",
                    "no cash alternative is guaranteed.",
                  ]}
                />
                <p>9.4 Where a non-cash Prize becomes unavailable because of circumstances outside Ringtone Riches’ reasonable control, Ringtone Riches may substitute it with:</p>
                <Bullets
                  items={[
                    "an equivalent Prize;",
                    "a Prize of equal or greater value; or",
                    "an appropriate cash alternative,",
                  ]}
                />
                <p>where reasonable and permitted by law.</p>
                <p>9.5 Where a cash alternative is offered, the applicable amount or basis for that alternative may be stated in the Competition Details.</p>
                <p>9.6 Winners are responsible for any costs or expenses not expressly stated as being included with the Prize.</p>
                <p>9.7 Where a third-party supplier provides a Prize, relevant supplier conditions may additionally apply.</p>
                <p>9.8 Holiday Prizes may be subject to specific conditions displayed in the applicable Competition Details, including accommodation standard, travel, insurance, availability and excluded costs.</p>
                <p>9.9 Winners are responsible for any tax, duty or other charge legally payable by them as a result of receiving a Prize.</p>
                <p>9.10 Once a physical Prize has been validly delivered to and accepted by the winner, responsibility for its ongoing possession, insurance, maintenance and use normally passes to the winner, subject to any applicable statutory rights or manufacturer warranty.</p>
                <p>9.11 Where delivery outside Great Britain is available, Ringtone Riches may require the winner to pay reasonable additional delivery charges where those charges were made clear before fulfilment.</p>
              </Section>

              <Section id="validation" kicker="Section 10" title="Prize Validation & Payment">
                <p>10.1 Before a Prize is paid or released, Ringtone Riches may validate the relevant Entry against its official Competition records.</p>
                <p>10.2 Validation may include checking:</p>
                <Bullets
                  items={[
                    "the winning ticket number;",
                    "the relevant Entry;",
                    "the winner’s identity and age;",
                    "eligibility;",
                    "account or Guest Entry information;",
                    "payment validity;",
                    "bank-account ownership where applicable;",
                    "compliance with these Terms; and",
                    "relevant security or fraud records.",
                  ]}
                />
                <p>10.3 For higher-value Prizes, Ringtone Riches may require additional verification including:</p>
                <Bullets
                  items={[
                    "photographic identification;",
                    "proof of address;",
                    "proof of payment-method ownership; and",
                    "proof that a nominated bank account is held solely or jointly in the winner’s name.",
                  ]}
                />
                <p>10.4 A Prize may be temporarily withheld while reasonable verification, fraud or security checks are completed.</p>
                <p>10.5 A Prize may be refused where Ringtone Riches reasonably determines following investigation that:</p>
                <Bullets
                  items={[
                    "the Entry was created fraudulently;",
                    "the Entrant was ineligible;",
                    "the ticket was not validly allocated;",
                    "Website systems were unlawfully manipulated;",
                    "an unauthorised payment method was used; or",
                    "the Prize has already been validly paid against the same winning Entry.",
                  ]}
                />
                <p>10.6 A Prize will not be paid twice against the same valid winning Ticket or Entry.</p>
                <p>10.7 Ringtone Riches will not refuse a legitimate Prize solely because of its value or because paying the Prize is commercially disadvantageous to the Promoter.</p>
                <p>10.8 Cash Prizes will normally be transferred to a verified personal bank account held solely or jointly in the winner’s name.</p>
                <p>10.9 Ringtone Riches will not normally transfer a monetary Prize to an unrelated third-party bank account.</p>
                <p>10.10 Where reasonable verification cannot establish the identity, eligibility or bank-account ownership of a purported winner, the Prize may remain withheld pending further investigation.</p>
              </Section>

              <Section id="instant-win" kicker="Section 11" title="Instant Win Competitions & Instant Reveal Features">
                <p>11.1 Ringtone Riches may operate Instant Win Competitions and Instant Reveal Features including, but not limited to:</p>
                <Bullets
                  items={[
                    "wheels;",
                    "spins;",
                    "scratch cards;",
                    "balloon games;",
                    "vault games;",
                    "reels; and",
                    "other interactive reveal mechanics.",
                  ]}
                />
                <p>11.2 Each valid instant-win Entry will have one definitive outcome recorded by the Website’s secure server-side system.</p>
                <p>11.3 The visual game, scratch, wheel, spin, balloon, vault, reel or other reveal mechanic is provided for presentation and entertainment purposes.</p>
                <p>11.4 An Entrant’s interaction with the visual reveal mechanic does not itself determine, alter or influence the definitive outcome recorded by the system.</p>
                <p>11.5 Where an Instant Win Competition uses ticket numbers, each valid Entry will be allocated a unique ticket number from the applicable Competition ticket pool.</p>
                <p>11.6 Winning instant-win ticket numbers or outcomes will be selected and allocated using the fair and random process applicable to the relevant Competition.</p>
                <p>11.7 Where a Competition contains multiple units of the same Prize, each Prize may be associated with its own unique winning Ticket.</p>
                <p>For example:</p>
                <p>£500 Cash × 5</p>
                <p>may represent five separate £500 Prizes, each associated with a separate winning Ticket.</p>
                <p>11.8 Winning Ticket numbers may be allocated from the overall ticket allocation or from eligible ticket ranges forming part of the applicable Competition setup.</p>
                <p>11.9 Once a valid Ticket has been allocated to an Entrant and the relevant outcome has been validly recorded by the server-side system, that recorded outcome will not be retrospectively altered merely because it results in a high-value Prize or is commercially disadvantageous to Ringtone Riches.</p>
                <p>11.10 Instant-win tickets, numbers and outcomes will be allocated on a fair and random basis.</p>
                <p>11.11 Ringtone Riches will retain appropriate records relating to the allocation process and obtain independent verification where required by applicable promotional rules.</p>
                <p>11.12 Entrants will know immediately, or as soon as reasonably practicable, whether an instant Entry has won and how any Prize may be claimed.</p>
                <p>11.13 Winners will not be required to pay an additional fee solely in order to claim a legitimate instant-win Prize.</p>
                <p>11.14 Where instant-win functionality is available through both a paid and qualifying free Entry route, the system will not distinguish between Entries solely because of the route used to enter.</p>
                <p>11.15 Where a customer-facing Prize table displays Prize quantities, Ticket numbers, winning Tickets or remaining Prizes, that information will be maintained in accordance with the relevant Competition records.</p>
                <p>11.16 Where an instant Prize is won, the relevant Prize record may be updated to display the winning Ticket number and permitted winner information.</p>
                <Note>
                  CAP currently requires instant-win tickets, tokens or numbers to be awarded fairly and randomly and verified by an independently audited statement showing that prizes were distributed or made available in that manner.
                </Note>
              </Section>

              <Section id="technical-faults" kicker="Section 12" title="Technical Faults, Errors & Result Validation">
                <p>12.1 Ringtone Riches takes reasonable steps to ensure that Competition systems and Website functionality operate correctly.</p>
                <p>12.2 Technical faults may nevertheless occur, including:</p>
                <Bullets
                  items={[
                    "server or hosting failures;",
                    "payment communication failures;",
                    "interrupted internet connections;",
                    "browser or device faults;",
                    "duplicate system requests;",
                    "graphical errors;",
                    "reveal-animation errors;",
                    "frontend display discrepancies;",
                    "database faults; or",
                    "other genuine technical malfunctions.",
                  ]}
                />
                <p>12.3 Before paying a Prize, Ringtone Riches may validate the relevant Entry against its authoritative system records.</p>
                <p>12.4 An Entry or result may be investigated where:</p>
                <Bullets
                  items={[
                    "a displayed Ticket does not match the official record;",
                    "the same Prize appears to have been awarded more than once;",
                    "the Entry fails reasonable fraud or security checks;",
                    "a visual reveal does not correspond with the recorded server-side result;",
                    "there is evidence of manipulation or unauthorised interference; or",
                    "a material technical fault occurred.",
                  ]}
                />
                <p>12.5 Where a genuine technical or graphical fault causes a reveal animation or frontend display to differ from the correctly generated and recorded server-side outcome, Ringtone Riches may investigate and correct the display error.</p>
                <p>12.6 Only the Entry and Ticket properly recorded in Ringtone Riches’ authoritative Competition system will be treated as the official Competition record.</p>
                <p>12.7 Ringtone Riches will not rely on this Section to avoid paying a legitimate Prize which was validly generated and recorded by the system.</p>
                <p>12.8 Where a technical fault materially affects the fairness or integrity of a Competition, Ringtone Riches may take reasonable action including:</p>
                <Bullets
                  items={[
                    "temporarily suspending the affected Competition;",
                    "investigating affected Entries;",
                    "correcting erroneous records;",
                    "refunding affected Entries;",
                    "reissuing Entries where fair and lawful; or",
                    "cancelling the affected Competition where continuation would be unfair or unlawful.",
                  ]}
                />
                <p>12.9 Any remedy will be determined reasonably having regard to:</p>
                <Bullets
                  items={[
                    "the official system records;",
                    "the nature of the fault;",
                    "fairness to affected Entrants;",
                    "applicable consumer rights; and",
                    "applicable law.",
                  ]}
                />
                <p>12.10 Incorrect Prize Award</p>
                <p>
                  If, because of a genuine technical fault, system error or human administrative error, a Prize is delivered or paid to a person who was not the valid winner according to the authoritative Competition records, Ringtone Riches may take reasonable steps to recover that Prize or its value and award the Prize to the valid winner.
                </p>
                <p>This clause will not affect a Prize which was legitimately won and correctly recorded.</p>
              </Section>

              <Section id="claims" kicker="Section 13" title="Winners, Contact Details & Prize Claims">
                <p>13.1 Entrants are responsible for ensuring that all contact details supplied to Ringtone Riches are accurate, complete and kept up to date.</p>
                <p>13.2 Ringtone Riches will make reasonable efforts to contact Competition winners using the contact information held for them.</p>
                <p>13.3 Instant-win winners may be notified:</p>
                <Bullets
                  items={[
                    "immediately on-screen;",
                    "through their Website account;",
                    "by email; or",
                    "through another appropriate communication method.",
                  ]}
                />
                <p>13.4 Draw-Based Competition winners may be contacted by:</p>
                <Bullets
                  items={[
                    "telephone;",
                    "email;",
                    "Website notification; or",
                    "another appropriate method.",
                  ]}
                />
                <p>13.5 Ringtone Riches will not normally be responsible for a failure to contact a winner where the information supplied by that Entrant was incorrect, incomplete or outdated, provided that reasonable attempts have been made using the information held.</p>
                <p>13.6 Winners must claim their Prize personally unless otherwise expressly agreed.</p>
                <p>13.7 Where a winner cannot be contacted, does not respond, fails required eligibility or verification checks, or fails to claim the Prize within the claim period stated in the Competition Details, Ringtone Riches may select an alternate winner using the same fair selection method used for the original winner, where appropriate.</p>
                <p>13.8 This process may continue until an eligible winner accepts the Prize.</p>
                <p>13.9 Ringtone Riches may require reasonable verification before a Prize is handed over or paid.</p>
              </Section>

              <Section id="delivery" kicker="Section 14" title="Prize Storage & Delivery">
                <p>14.1 Where Ringtone Riches is holding a physical Prize pending collection or delivery, reasonable arrangements will be made with the winner.</p>
                <p>14.2 Where a winner unreasonably delays collection or delivery for an extended period, Ringtone Riches may require the winner to reimburse reasonable storage costs, provided that the winner has first been informed of those costs.</p>
                <p>14.3 Ringtone Riches may specify a reasonable collection or delivery period in the applicable Competition Details or winner communication.</p>
                <p>14.4 Nothing in this Section affects an Entrant’s statutory rights.</p>
              </Section>

              <Section id="publicity" kicker="Section 15" title="Winner Information & Publicity">
                <p>15.1 Ringtone Riches may publish or otherwise make available sufficient winner information to demonstrate that genuine Prize awards have taken place.</p>
                <p>15.2 Such information may include:</p>
                <Bullets
                  items={[
                    "first name;",
                    "surname initial or surname where appropriate;",
                    "town or general location;",
                    "winning Ticket number;",
                    "Prize amount or description;",
                    "date and time of the win.",
                  ]}
                />
                <p>15.3 Ringtone Riches may invite winners to participate in reasonable photography, video, testimonial or publicity activity.</p>
                <p>15.4 Any use of a winner’s photograph, video or testimonial will be handled in accordance with applicable privacy and consent requirements.</p>
                <p>
                  15.5 An Entrant who objects to public disclosure of their name should contact: <MailLink />
                </p>
                <p>15.6 Where required, Ringtone Riches may provide relevant winner information to:</p>
                <Bullets
                  items={[
                    "the Advertising Standards Authority;",
                    "a court;",
                    "law-enforcement authorities;",
                    "a regulator; or",
                    "another competent authority.",
                  ]}
                />
              </Section>

              <Section id="points" kicker="Section 16" title="Ringtone Points, Wallet Credit & Promotional Credit">
                <p>16.1 Ringtone Points are Website credit.</p>
                <p>16.2 Unless expressly stated otherwise, Ringtone Points:</p>
                <Bullets
                  items={[
                    "have a notional value of £0.01 each;",
                    "may only be used for eligible Website activities;",
                    "cannot be directly exchanged for cash;",
                    "cannot be withdrawn;",
                    "cannot be sold; and",
                    "cannot be transferred between users.",
                  ]}
                />
                <p>16.3 Joining bonuses, promotional credit, goodwill credit, free credit and other complimentary Website credit are non-withdrawable unless expressly stated otherwise.</p>
                <p>16.4 Promotional credit must be used in accordance with the conditions of the relevant promotion.</p>
                <p>16.5 Only cash winnings validly generated from eligible paid gameplay may form part of a withdrawable cash balance unless otherwise expressly stated.</p>
                <p>16.6 Ringtone Riches may remove, reverse or adjust credit that has been:</p>
                <Bullets
                  items={[
                    "awarded in error;",
                    "obtained fraudulently;",
                    "generated through technical exploitation;",
                    "obtained through chargeback abuse; or",
                    "obtained contrary to these Terms.",
                  ]}
                />
                <p>16.7 Promotional offers may contain additional specific conditions displayed with the relevant offer.</p>
                <p>16.8 If Ringtone Riches introduces an expiry period for any category of promotional or wallet credit, that expiry period will be clearly disclosed when the Credit is awarded or within the customer’s account.</p>
              </Section>

              <Section id="protections" kicker="Section 17" title="Player Protections & Account Controls">
                <p>17.1 Ringtone Riches is strictly 18+.</p>
                <p>17.2 We may carry out age and identity verification checks.</p>
                <p>17.3 Ringtone Riches may provide customer account controls including:</p>
                <Bullets
                  items={[
                    "Daily Spending Limits;",
                    "Temporary Suspension; and",
                    "Permanent Account Closure.",
                  ]}
                />
                <p>17.4 Where available, a customer may set a Daily Spending Limit controlling the maximum amount they can spend during the applicable period.</p>
                <p>17.5 Customers may apply a Temporary Suspension for a period made available through the Website.</p>
                <p>17.6 During a Temporary Suspension, the customer may be prevented from:</p>
                <Bullets
                  items={[
                    "logging in;",
                    "entering Competitions;",
                    "using Instant-Win Features; or",
                    "making new purchases.",
                  ]}
                />
                <p>17.7 Where a Temporary Suspension is designated as irreversible during the selected period, it cannot normally be removed early.</p>
                <p>17.8 Customers may request Permanent Account Closure through the available Website controls or by contacting support.</p>
                <p>17.9 Ringtone Riches may monitor activity for indicators of potential financial harm, including:</p>
                <Bullets
                  items={[
                    "unusually high or rapid expenditure;",
                    "repeated attempts to exceed limits;",
                    "frequent changes to limits;",
                    "repeated unsuccessful payment attempts; or",
                    "self-reported financial difficulty.",
                  ]}
                />
                <p>17.10 Where we reasonably identify a potential risk, we may take proportionate action including:</p>
                <Bullets
                  items={[
                    "providing safer-participation messaging;",
                    "encouraging the use of spending limits or breaks;",
                    "restricting activity;",
                    "requesting verification;",
                    "temporarily suspending an account; or",
                    "closing an account in serious circumstances.",
                  ]}
                />
                <p>17.11 Participation should always remain recreational and affordable.</p>
              </Section>

              <Section id="aml" kicker="Section 18" title="Anti-Money Laundering, Identity & Payment Checks">
                <p>18.1 Ringtone Riches may carry out reasonable identity, fraud and financial-crime checks.</p>
                <p>18.2 We may request:</p>
                <Bullets
                  items={[
                    "photographic identification;",
                    "proof of address;",
                    "evidence of payment-method ownership;",
                    "bank-account information; and",
                    "other supporting information reasonably necessary for verification.",
                  ]}
                />
                <p>18.3 Prize payments may be delayed while reasonable verification checks are completed.</p>
                <p>18.4 No cash payments are accepted in person.</p>
                <p>18.5 Cash winnings may be paid:</p>
                <Bullets
                  items={[
                    "to the original eligible payment method where appropriate; or",
                    "by verified bank transfer to an account held solely or jointly in the winner’s name.",
                  ]}
                />
                <p>18.6 Ringtone Riches may report suspicious or unlawful activity to relevant authorities where required or permitted by law.</p>
              </Section>

              <Section id="chargebacks" kicker="Section 19" title="Payment Disputes & Chargebacks">
                <p>19.1 If an Entrant believes that a payment has been taken incorrectly or without authority, they should contact Ringtone Riches promptly so that the matter can be investigated.</p>
                <p>19.2 Nothing in these Terms prevents an Entrant from exercising lawful rights to dispute an unauthorised or incorrect payment with their bank or payment provider.</p>
                <p>19.3 Where Ringtone Riches reasonably determines following investigation that a chargeback has been raised fraudulently or without legitimate basis, it may:</p>
                <Bullets
                  items={[
                    "suspend or close the relevant account;",
                    "void Entries funded by the disputed transaction where appropriate;",
                    "recover promotional credit or benefits obtained through the disputed transaction;",
                    "recover improperly obtained Prizes where legally permitted; and",
                    "take reasonable steps to recover sums legitimately due.",
                  ]}
                />
                <p>19.4 Repeated fraudulent or abusive chargeback activity may result in permanent restriction from Ringtone Riches.</p>
              </Section>

              <Section id="data" kicker="Section 20" title="Data Protection">
                <p>
                  20.1 Personal information will be collected and processed in accordance with applicable data-protection law and our{" "}
                  <a href="/privacy-policy">Privacy Policy</a>.
                </p>
                <p>20.2 Information may be processed for purposes including:</p>
                <Bullets
                  items={[
                    "administering Competitions;",
                    "processing Entries and payments;",
                    "allocating Tickets;",
                    "selecting and validating winners;",
                    "fulfilling Prizes;",
                    "providing customer support;",
                    "preventing fraud;",
                    "maintaining Website security;",
                    "complying with legal obligations; and",
                    "operating and improving Ringtone Riches.",
                  ]}
                />
                <p>20.3 Information may be shared with service providers where reasonably necessary for these purposes and permitted by law.</p>
                <p>20.4 Where personal data is processed outside the United Kingdom, Ringtone Riches will take appropriate measures required by applicable data-protection law.</p>
              </Section>

              <Section id="marketing" kicker="Section 21" title="Text Message & Marketing Communications">
                <p>21.1 Where an Entrant expressly opts into SMS or other direct marketing, Ringtone Riches may send promotional communications using the contact details provided.</p>
                <p>21.2 Marketing may include:</p>
                <Bullets
                  items={[
                    "Competition promotions;",
                    "new game notifications;",
                    "Prize information;",
                    "offers;",
                    "Website updates; and",
                    "Entry reminders.",
                  ]}
                />
                <p>21.3 Consent to marketing is not a condition of purchasing an Entry.</p>
                <p>21.4 Entrants may unsubscribe at any time using the method provided in the communication, including replying STOP where supported.</p>
              </Section>

              <Section id="fraud" kicker="Section 22" title="Fraud, Abuse & Misuse">
                <p>22.1 Entrants must not:</p>
                <Bullets
                  items={[
                    "commit or attempt fraud;",
                    "provide false or misleading identity information;",
                    "create multiple accounts to evade limits;",
                    "use bots, scripts or automated Entry systems;",
                    "use another person’s payment method without authority;",
                    "interfere with Website software or infrastructure;",
                    "manipulate or attempt to manipulate Ticket allocation or Competition outcomes;",
                    "deliberately exploit technical faults;",
                    "access restricted systems without permission;",
                    "coordinate fraudulent chargebacks; or",
                    "otherwise attempt to obtain an unfair advantage.",
                  ]}
                />
                <p>22.2 Ringtone Riches may investigate suspected misuse.</p>
                <p>22.3 Where, following reasonable investigation, Ringtone Riches determines that prohibited conduct occurred, we may:</p>
                <Bullets
                  items={[
                    "suspend or close the relevant account;",
                    "void affected Entries;",
                    "withhold or recover improperly obtained Prizes;",
                    "restrict future participation;",
                    "report activity to payment providers or relevant authorities; and",
                    "take legal action where appropriate.",
                  ]}
                />
                <p>22.4 Legitimate high-volume participation within the published Entry limits will not, by itself, be regarded as fraud or abuse.</p>
              </Section>

              <Section id="refunds" kicker="Section 23" title="Refunds">
                <p>23.1 Successfully processed Competition Entries are generally final.</p>
                <p>23.2 Refunds may be provided where:</p>
                <Bullets
                  items={[
                    "a Competition is cancelled;",
                    "a duplicate payment is confirmed;",
                    "payment is taken but no valid Entry is generated;",
                    "an Entry cannot be included because of a genuine technical issue; or",
                    "a refund is otherwise required by law.",
                  ]}
                />
                <p>23.3 Refunds will not normally be provided simply because an Entrant:</p>
                <Bullets
                  items={[
                    "changes their mind;",
                    "does not win;",
                    "decides after Entry that they no longer wish to participate; or",
                    "failed to read information clearly displayed before Entry.",
                  ]}
                />
              </Section>

              <Section id="liability" kicker="Section 24" title="Liability">
                <p>24.1 Nothing in these Terms excludes or limits liability where doing so would be unlawful.</p>
                <p>24.2 Subject to applicable law, Ringtone Riches will not be responsible for losses caused solely by circumstances outside our reasonable control.</p>
                <p>24.3 This may include:</p>
                <Bullets
                  items={[
                    "failures of an Entrant’s device;",
                    "internet disruption outside our control;",
                    "third-party service failures;",
                    "incorrect information supplied by an Entrant;",
                    "postal delays outside our control; or",
                    "unauthorised account use resulting from an Entrant failing to protect their credentials.",
                  ]}
                />
                <p>24.4 Ringtone Riches will not normally be liable for indirect or unforeseeable losses arising from participation except where liability cannot lawfully be excluded.</p>
                <p>24.5 Nothing in these Terms affects an Entrant’s statutory consumer rights.</p>
              </Section>

              <Section id="electronic" kicker="Section 25" title="Electronic Communications & Platform Operation">
                <p>25.1 Ringtone Riches does not guarantee that electronic communications will always be uninterrupted, error-free or received immediately.</p>
                <p>25.2 Ringtone Riches will not normally be responsible for failures caused solely by:</p>
                <Bullets
                  items={[
                    "internet or telecommunications outages;",
                    "email-provider failures;",
                    "mobile-network disruption;",
                    "third-party payment systems;",
                    "device incompatibility; or",
                    "services outside Ringtone Riches’ reasonable control.",
                  ]}
                />
                <p>25.3 Entrants are responsible for checking their account and contact information and for ensuring that their device and internet connection are suitable for accessing the Website.</p>
                <p>25.4 Ringtone Riches will use reasonable efforts to support current commonly used browsers and mobile devices, but cannot guarantee identical display or performance on every device, browser or operating system.</p>
              </Section>

              <Section id="availability" kicker="Section 26" title="Website Availability">
                <p>26.1 Ringtone Riches aims to keep the Website available and functioning correctly.</p>
                <p>26.2 Continuous or uninterrupted availability is not guaranteed.</p>
                <p>26.3 Ringtone Riches may temporarily suspend all or part of the Website for:</p>
                <Bullets
                  items={[
                    "maintenance;",
                    "upgrades;",
                    "security work;",
                    "technical investigation;",
                    "emergency repair; or",
                    "other legitimate operational reasons.",
                  ]}
                />
                <p>26.4 Where reasonably practicable, we will seek to minimise disruption to active Competitions.</p>
              </Section>

              <Section id="acceptable-use" kicker="Section 27" title="Acceptable Use">
                <p>27.1 The Website may only be used for lawful, personal and non-commercial purposes unless Ringtone Riches expressly agrees otherwise.</p>
                <p>27.2 Users must not:</p>
                <Bullets
                  items={[
                    "introduce viruses, malware or malicious software;",
                    "attempt unauthorised access;",
                    "interfere with Website infrastructure;",
                    "make excessive or malicious traffic demands;",
                    "attack or disrupt the Website;",
                    "scrape restricted information;",
                    "impersonate another person;",
                    "submit fraudulent information;",
                    "infringe intellectual-property rights;",
                    "reverse engineer software except where expressly permitted by law; or",
                    "otherwise misuse the Website.",
                  ]}
                />
                <p>27.3 Serious misuse may be reported to the relevant authorities.</p>
              </Section>

              <Section id="ip" kicker="Section 28" title="Intellectual Property">
                <p>28.1 The Ringtone Riches brand, trade name, logos, game artwork, graphics, Website design, software, text, audiovisual content and other original material are protected by applicable intellectual-property laws.</p>
                <p>28.2 Nothing in these Terms transfers ownership of Ringtone Riches intellectual property to an Entrant.</p>
                <p>28.3 Ringtone Riches material must not be copied, reproduced, redistributed, reverse engineered or commercially exploited without permission except where permitted by law.</p>
                <p>28.4 Third-party trademarks or materials displayed on the Website remain the property of their respective owners.</p>
              </Section>

              <Section id="third-party" kicker="Section 29" title="External Websites & Third-Party Services">
                <p>29.1 The Website may contain links to websites, payment providers, social-media platforms or services operated by third parties.</p>
                <p>29.2 Such links are provided for convenience or information only.</p>
                <p>29.3 Ringtone Riches does not control third-party websites and is not responsible for their:</p>
                <Bullets
                  items={[
                    "content;",
                    "availability;",
                    "security;",
                    "privacy practices; or",
                    "independent terms and conditions.",
                  ]}
                />
                <p>29.4 The inclusion of a link does not imply endorsement or partnership unless expressly stated.</p>
              </Section>

              <Section id="platforms" kicker="Section 30" title="Meta, Apple & Google Disclaimer">
                <p>30.1 Competitions promoted through the Website, App or Ringtone Riches social-media channels are not sponsored, endorsed, administered by or associated with Meta, Apple or Google unless expressly stated otherwise.</p>
                <p>30.2 By entering a Competition, Entrants acknowledge that Meta, Apple and Google are not responsible for administering or fulfilling Ringtone Riches Competitions.</p>
              </Section>

              <Section id="fair-admin" kicker="Section 31" title="Fair Administration of Competitions">
                <p>31.1 Ringtone Riches will administer its Competitions fairly and in accordance with the applicable Competition Details and these Terms.</p>
                <p>31.2 Ringtone Riches will not retrospectively alter a legitimately recorded Competition result simply because that result is commercially unfavourable.</p>
                <p>31.3 Significant conditions that could materially affect an Entrant’s decision to participate will be displayed in the Competition Details or otherwise appropriately brought to the Entrant’s attention.</p>
                <p>31.4 Ringtone Riches may correct genuine clerical, graphical or technical errors where doing so does not unfairly deprive an Entrant of a validly recorded Prize.</p>
                <p>31.5 Ringtone Riches may retain Competition records, Entry records, Ticket records and audit information for verification, investigation, security and fair-administration purposes.</p>
                <Note>
                  CAP specifically requires significant conditions to be communicated where omission could mislead consumers.
                </Note>
              </Section>

              <Section id="cancellation" kicker="Section 32" title="Suspension or Cancellation of a Competition">
                <p>32.1 Ringtone Riches may hold void, suspend, cancel or amend a Competition where circumstances beyond our reasonable control make this unavoidable.</p>
                <p>32.2 Such circumstances may include:</p>
                <Bullets
                  items={[
                    "serious technical failures;",
                    "significant security incidents;",
                    "payment-system failures;",
                    "telecommunications or infrastructure failures;",
                    "legal or regulatory requirements;",
                    "force majeure events; or",
                    "another exceptional circumstance that makes continued operation unfair, unlawful or impracticable.",
                  ]}
                />
                <p>32.3 Where a Competition can reasonably continue following a temporary suspension, Ringtone Riches may resume it once the relevant issue has been resolved.</p>
                <p>32.4 Where a Competition cannot reasonably continue, Ringtone Riches may cancel it and provide affected paid Entrants with an appropriate refund or other remedy required by law.</p>
              </Section>

              <Section id="assignment" kicker="Section 33" title="Business Transfer & Assignment">
                <p>33.1 Entrants may not transfer their rights under these Terms to another person except where expressly permitted by Ringtone Riches or required by law.</p>
                <p>33.2 Ringtone Riches may transfer its rights and obligations under these Terms to a successor, purchaser or replacement operator of the business, provided that doing so does not materially reduce the rights of Entrants in existing Competitions.</p>
              </Section>

              <Section id="third-party-rights" kicker="Section 34" title="Third-Party Rights">
                <p>34.1 Except where expressly stated otherwise, a person who is not a party to these Terms shall have no right under the Contracts (Rights of Third Parties) Act 1999 to enforce any provision of these Terms.</p>
              </Section>

              <Section id="complaints" kicker="Section 35" title="Complaints">
                <p>
                  35.1 Customers should raise complaints initially with Ringtone Riches by contacting: <MailLink />
                </p>
                <p>35.2 Complaints should include sufficient information to enable us to investigate, including where applicable:</p>
                <Bullets
                  items={[
                    "customer name;",
                    "account or Guest Entry details;",
                    "Competition name;",
                    "order number;",
                    "Ticket number;",
                    "date and time of the issue; and",
                    "a description of the complaint.",
                  ]}
                />
                <p>35.3 Ringtone Riches will use reasonable efforts to investigate and respond within an appropriate period.</p>
              </Section>

              <Section id="changes" kicker="Section 36" title="Changes to These Terms">
                <p>36.1 Ringtone Riches may amend these Terms from time to time.</p>
                <p>36.2 The latest version will be made available on the Website.</p>
                <p>36.3 Updated Terms will normally apply to future Entries from their publication date.</p>
                <p>36.4 Where an Entrant has already entered a Competition, the applicable Terms in force at the time of Entry will normally continue to govern that Entry.</p>
                <p>36.5 Ringtone Riches will not retrospectively introduce a material change that unfairly disadvantages an existing Entrant unless the change is reasonably necessary for legal, regulatory or fairness reasons.</p>
              </Section>

              <Section id="general" kicker="Section 37" title="General">
                <p>37.1 If any provision of these Terms is determined by a court of competent jurisdiction to be invalid or unenforceable, that decision will not automatically affect the remaining provisions.</p>
                <p>37.2 Failure by Ringtone Riches to enforce a provision immediately does not permanently waive its right to enforce that provision.</p>
                <p>37.3 Headings are included for convenience and do not affect interpretation.</p>
                <p>37.4 These Terms, the applicable Competition Details and policies expressly incorporated into them constitute the entire agreement between Ringtone Riches and the Entrant regarding the relevant Competition.</p>
                <p>37.5 These Terms supersede prior terms or representations relating to the same Competition to the extent that they are inconsistent with the applicable Competition Details and Terms in force at the time of Entry.</p>
              </Section>

              <Section id="governing-law" kicker="Section 38" title="Governing Law">
                <p>38.1 These Terms and the operation of Ringtone Riches Competitions are governed by the laws of England and Wales.</p>
                <p>38.2 Consumers continue to benefit from any mandatory legal rights which apply in their country of residence.</p>
                <p>38.3 Subject to those mandatory rights, the courts of England and Wales shall have jurisdiction over disputes arising from or in connection with these Terms or a Ringtone Riches Competition.</p>
              </Section>
            </article>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
