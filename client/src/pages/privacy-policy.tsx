import LegalLayout, {
  Bullets,
  MailLink,
  Note,
  RelatedLegal,
  Section,
} from "@/components/legal/LegalLayout";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "explains", label: "What this covers" },
  { id: "data", label: "Data we process" },
  { id: "purposes", label: "Why we process it" },
  { id: "lawful-basis", label: "Lawful basis" },
  { id: "refuse", label: "If you refuse" },
  { id: "sharing", label: "Sharing data" },
  { id: "rights", label: "Your rights" },
  { id: "security", label: "Security" },
  { id: "retention", label: "Storage & retention" },
  { id: "third-parties", label: "Third-party links" },
  { id: "cookies", label: "Cookies" },
  { id: "gdpr", label: "GDPR statement" },
  { id: "need", label: "What we need and why" },
  { id: "faq", label: "FAQs" },
  { id: "access", label: "Access your information" },
  { id: "more", label: "Related pages" },
] as const;

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      badge="Legal"
      title="PRIVACY & COOKIES"
      sub="How Ringtone Riches collects, uses, stores and shares personal data, including under UK GDPR."
      updated="October 2025"
      toc={TOC}
    >
      <Section id="overview" kicker="Start here" title="Overview">
        <p>
          We protect your data. This Privacy Policy sets out how Ringtone Riches (“we”, “us”, or “our”),
          registered at 1 West Havelock Street, South Shields, Tyne and Wear, NE33 5AF, collects, processes,
          stores, and discloses your personal information.
        </p>
        <p>
          We are committed to handling your information in compliance with the EU General Data Protection
          Regulation (GDPR), the UK Data Protection Act 2018, and other relevant data protection laws.
          Before using our website, please read this policy to understand how and why we process your data.
        </p>
        <div className="rr-legal-panel">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
            Registered address
          </p>
          <p className="mb-0">
            1 West Havelock Street<br />
            South Shields<br />
            Tyne and Wear<br />
            NE33 5AF
          </p>
        </div>
      </Section>

      <Section id="explains" title="What this document explains">
        <Bullets
          items={[
            "What personal data we may collect about you",
            "How we collect, store, and protect your data",
            "The purposes for which your data is processed",
            "Your legal rights under data protection laws",
          ]}
        />
        <p>
          If you have any questions or concerns about this policy, contact us at <MailLink />.
        </p>
      </Section>

      <Section id="data" title="The personal data we process">
        <p>
          We collect personal data when you interact with our website, enter competitions, subscribe to
          updates, or contact us. This may include your full name, address, country, contact details,
          competition entries, and technical information obtained via cookies.
        </p>
      </Section>

      <Section id="purposes" title="The purposes for which we process your data">
        <Bullets
          items={[
            "Confirming entries and sending competition updates",
            "Processing entry payments and notifying winners",
            "Personalising your experience and providing support",
            "Sending promotional materials (if you have opted in)",
            "Administering events and services you subscribe to",
          ]}
        />
      </Section>

      <Section id="lawful-basis" title="Lawful basis for processing">
        <p>We process your personal data under the following lawful bases:</p>
        <Bullets
          items={[
            "Consent — when you opt in to receive marketing or create an account.",
            "Contract — when processing is necessary to fulfil a competition entry or deliver a prize.",
            "Legal obligation — when required by law or regulation.",
            "Legitimate interests — to operate and improve our services, prevent fraud, and ensure fair participation.",
          ]}
        />
      </Section>

      <Section id="refuse" title="If you refuse to provide personal data">
        <p>
          Where we must collect personal data by law or under the terms of an agreement with you, and you
          fail to provide that data when requested, we may be unable to perform our obligations (for
          example, to deliver your prize). In such cases, we may have to cancel the prize and select
          another winner, though we will notify you first.
        </p>
      </Section>

      <Section id="sharing" title="Sharing information with affiliates and third parties">
        <p>
          We do not share your personal data with third parties except as described in this policy, or
          where you have otherwise agreed. We may share data with our trusted partners (“Affiliates”) to
          provide services and perform legitimate business operations. This includes providers for email
          delivery, payment processing, analytics, hosting, marketing, logistics, and technical integration.
        </p>
        <p>
          All third parties processing your data follow strict data protection procedures in compliance
          with applicable law. Unless otherwise stated, we remain the data controller for your information
          even where third parties act as processors.
        </p>
      </Section>

      <Section id="rights" title="Your rights as a data subject">
        <Bullets
          items={[
            "The right to request a copy of your data held by us (free of charge).",
            "The right to correct any inaccurate or incomplete personal data held by us.",
            "The right to request that we erase the personal data we hold about you.",
            "The right to request that we restrict the processing of your data.",
            "The right to object to certain types of processing of your data by us.",
            "The right to lodge a complaint with the Information Commissioner’s Office (ICO).",
          ]}
        />
      </Section>

      <Section id="security" title="Data security">
        <p>
          We implement appropriate technical and organisational measures to protect your personal data
          against unauthorised access, alteration, disclosure, or destruction. While no online system is
          completely secure, we maintain strong safeguards to ensure the confidentiality and integrity of
          your data.
        </p>
      </Section>

      <Section id="retention" title="Storage and retention of your data">
        <p>
          We store your data for as long as necessary to provide our services and up to twelve months
          after the promotional period of the relevant competition or contest. If you request account
          deletion, we will erase your data once it is no longer required to fulfil obligations or comply
          with legal requirements.
        </p>
      </Section>

      <Section id="third-parties" title="Links to third parties">
        <p>
          Our website may contain links to third-party websites beyond our control. Please review their
          respective privacy policies before providing any personal data. We cannot be held responsible
          for the practices of third-party websites.
        </p>
      </Section>

      <Section id="cookies" title="Cookies">
        <p>
          Our website uses cookies to distinguish you from other users, improving your experience and
          allowing us to enhance website performance. You can manage or block cookies via your browser
          settings, though blocking essential cookies may affect site functionality.
        </p>
      </Section>

      <Section id="gdpr" title="Ringtone Riches (GDPR) statement">
        <p>
          Ringtone Riches is registered as a Data Controller with the Information Commissioner’s Office
          (ICO), registration reference: 245603. We have implemented internal policies and controls to
          ensure full compliance with GDPR and UK data protection regulations.
        </p>
        <div className="rr-legal-panel">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
            ICO registration
          </p>
          <p className="mb-0">Data Controller reference 245603</p>
        </div>
        <p>Ringtone Riches’ activities fall within three key areas:</p>
        <Bullets
          items={[
            "A data controller of its own employee data.",
            "A data controller or processor of third-party data such as activity relating to direct marketing.",
            "A data processor or controller of customer personal data.",
          ]}
        />
        <p>
          We have designed our company policies and procedures to ensure full GDPR compliance, including
          reviews of all data handling and security protocols.
        </p>
      </Section>

      <Section id="need" title="What we need, and what we do with it">
        <p>
          We collect personal data such as name, age, address, phone number, and email address to verify
          eligibility, process competition entries, and deliver prizes to winners. We will not collect any
          data that we do not need to provide our services.
        </p>
        <p>
          All data is processed within the UK, and all servers we use are based in the UK. We may share
          data with trusted third-party service providers such as email delivery, website analytics,
          logistics, and social media platforms, all of which maintain GDPR-compliant policies and
          procedures.
        </p>
      </Section>

      <Section id="faq" title="Frequently asked questions">
        <div className="rr-legal-faq">
          <article>
            <h3>What personal data do you process?</h3>
            <p>
              We process any data relating to an identifiable person, such as name, age, address, phone
              number, and email.
            </p>
          </article>
          <article>
            <h3>For what purpose do you process this data?</h3>
            <p>
              Data is collected for legitimate purposes, including running skill, judgment, or
              knowledge-based competitions and verifying eligibility.
            </p>
          </article>
          <article>
            <h3>What are the risks to data subjects’ rights?</h3>
            <p>
              We believe risks are minimal due to secure storage and limited data sharing. Potential risks
              include loss, alteration, or unauthorised access, which we mitigate through strict internal
              security controls.
            </p>
          </article>
          <article>
            <h3>What provisions do you have for deletion?</h3>
            <p>
              When requested, we delete or return data after verifying the request. Otherwise, we retain
              data for 12 months from last contact for legitimate business purposes.
            </p>
          </article>
          <article>
            <h3>Do you understand GDPR requirements?</h3>
            <p>
              Yes. Ringtone Riches fully understands and complies with GDPR requirements and their impact
              on our customers and business operations.
            </p>
          </article>
        </div>
      </Section>

      <Section id="access" title="Access to your information">
        <p>
          You have the right to access the personal data we hold about you. Requests can be made free of
          charge by emailing <MailLink />. If any information we hold about you is incorrect, please
          contact us so we can promptly update or correct it.
        </p>
        <Note>
          Questions about this policy go to <MailLink />. For competition rules, see Terms & Conditions.
        </Note>
      </Section>

      <Section id="more" kicker="Also useful" title="Related pages">
        <RelatedLegal exclude="privacy" />
      </Section>
    </LegalLayout>
  );
}
