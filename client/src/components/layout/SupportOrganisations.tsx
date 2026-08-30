import mindLogo from "@assets/support/mind-official.png";
import nationalDebtlineLogo from "@assets/support/national-debtline-official.svg";
import samaritansLogo from "@assets/support/samaritans-official.svg";
import citizensAdviceLogo from "@assets/support/citizens-advice-official.svg";
import moneyAdviceTrustLogo from "@assets/support/money-advice-trust-official.svg";

const ORGS = [
  {
    name: "Mind",
    href: "https://www.mind.org.uk",
    testId: "link-support-mind",
    src: mindLogo,
    className: "rr-support-logo--mind",
  },
  {
    name: "National Debtline",
    href: "https://nationaldebtline.org",
    testId: "link-support-national-debtline",
    src: nationalDebtlineLogo,
    className: "rr-support-logo--ndl",
  },
  {
    name: "Samaritans",
    href: "https://www.samaritans.org",
    testId: "link-support-samaritans",
    src: samaritansLogo,
    className: "rr-support-logo--samaritans",
  },
  {
    name: "Citizens Advice",
    href: "https://www.citizensadvice.org.uk",
    testId: "link-support-citizens-advice",
    src: citizensAdviceLogo,
    className: "rr-support-logo--ca",
  },
  {
    name: "Money Advice Trust",
    href: "https://moneyadvicetrust.org",
    testId: "link-support-money-advice-trust",
    src: moneyAdviceTrustLogo,
    className: "rr-support-logo--mat",
  },
] as const;

export default function SupportOrganisations() {
  return (
    <section className="rr-support-strip" aria-labelledby="rr-support-heading">
      <p id="rr-support-heading" className="rr-support-copy">
        <span className="rr-support-copy-lead">Stay in control of how you play.</span>
        Independent UK support is here if you ever need it.
      </p>
      <ul className="rr-support-orgs">
        {ORGS.map(({ name, href, testId, src, className }) => (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="rr-support-org"
              data-testid={testId}
              aria-label={`${name} (opens in a new tab)`}
            >
              <img src={src} alt="" className={`rr-support-logo ${className}`} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
