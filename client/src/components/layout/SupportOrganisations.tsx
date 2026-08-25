import mindLogo from "@assets/support/mind.png";
import nationalDebtlineLogo from "@assets/support/national-debtline.png";
import nationalDebtlineDayLogo from "@assets/support/national-debtline-day.png";
import samaritansLogo from "@assets/support/samaritans.png";
import samaritansDayLogo from "@assets/support/samaritans-day.png";
import citizensAdviceLogo from "@assets/support/citizens-advice.png";
import citizensAdviceDayLogo from "@assets/support/citizens-advice-day.png";
import moneyAdviceTrustLogo from "@assets/support/money-advice-trust.png";

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
    srcDay: nationalDebtlineDayLogo,
    className: "rr-support-logo--ndl",
  },
  {
    name: "Samaritans",
    href: "https://www.samaritans.org",
    testId: "link-support-samaritans",
    src: samaritansLogo,
    srcDay: samaritansDayLogo,
    className: "rr-support-logo--samaritans",
  },
  {
    name: "Citizens Advice",
    href: "https://www.citizensadvice.org.uk",
    testId: "link-support-citizens-advice",
    src: citizensAdviceLogo,
    srcDay: citizensAdviceDayLogo,
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
        {ORGS.map(({ name, href, testId, src, className, ...rest }) => {
          const srcDay = "srcDay" in rest ? rest.srcDay : null;
          return (
            <li key={name}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rr-support-org"
                data-testid={testId}
                aria-label={`${name} (opens in a new tab)`}
              >
                <img
                  src={src}
                  alt=""
                  className={`rr-support-logo rr-support-logo--night ${className}`}
                />
                {srcDay ? (
                  <img
                    src={srcDay}
                    alt=""
                    className={`rr-support-logo rr-support-logo--day ${className}`}
                  />
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
