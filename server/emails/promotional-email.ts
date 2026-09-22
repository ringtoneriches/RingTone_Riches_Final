/**
 * The campaign / promotional email.
 *
 * This one is deliberately NOT built on wrapBrandEmail. Transactional mail
 * wants to be quiet and identical every time; a campaign wants presence. Tying
 * them together meant every change here risked the receipts, so this renders
 * its own document and borrows only the brand primitives.
 */
import {
  BRAND_NAME,
  FROM_EMAIL,
  brandLogoUrl,
  brandSiteUrl,
  escapeHtml,
} from "../email-chrome";

const GOLD = "#F1D47A";
const GOLD_DEEP = "#D4AF37";
const RED = "#FF263D";
const RED_DEEP = "#C8102E";
const INK = "#050505";
const PANEL = "#0A0A0C";
const IVORY = "#EFEAE1";
const MUTED = "#8E8E98";

export type PromotionalContent = {
  subject: string;
  title: string;
  message: string;
  kicker?: string;
  ctaLabel?: string;
  ctaHref?: string;
  offerHtml?: string;
  preheader?: string;
  /** Where "manage preferences" points. */
  optOutHref?: string;
};

/** Gold outline button, with the VML twin Outlook needs. */
function ctaButton(label: string, href: string) {
  const width = Math.max(210, Math.min(340, label.length * 13 + 74));
  return `
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;" role="presentation">
      <tr>
        <td align="center">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
            href="${escapeHtml(href)}" style="height:52px;v-text-anchor:middle;width:${width}px;"
            arcsize="14%" strokecolor="${GOLD}" strokeweight="1px" fillcolor="${INK}">
            <w:anchorlock/>
            <center style="color:${GOLD};font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;">
              ${escapeHtml(label.toUpperCase())}
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-- -->
          <table cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td align="center" bgcolor="${INK}"
                style="background-color: ${INK}; border: 1px solid ${GOLD}; border-radius: 8px;">
                <a href="${escapeHtml(href)}" style="display: block; padding: 17px 44px; color: ${GOLD}; text-decoration: none; font-size: 13px; font-weight: 800; letter-spacing: 0.17em; text-transform: uppercase; font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif; white-space: nowrap;">
                  ${escapeHtml(label)}
                </a>
              </td>
            </tr>
          </table>
          <!--<![endif]-->
        </td>
      </tr>
    </table>`;
}

/** Short gold rule with a diamond, to break the headline from the copy. */
function ornament() {
  const bar = `<td width="54" style="border-bottom: 1px solid rgba(241,212,122,0.34); font-size: 0; line-height: 0;">&nbsp;</td>`;
  return `
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;" role="presentation">
      <tr>
        ${bar}
        <td style="padding: 0 11px; color: ${GOLD_DEEP}; font-size: 11px; line-height: 1;">&#9670;</td>
        ${bar}
      </tr>
    </table>`;
}

export function renderPromotionalEmail(c: PromotionalContent) {
  const site = brandSiteUrl();
  const ctaHref = c.ctaHref || site;
  const ctaLabel = c.ctaLabel || "See what's new";
  const optOut = c.optOutHref || `${site}/notifications`;
  const preheader = escapeHtml(c.preheader || c.message.slice(0, 140).replace(/\s+/g, " ").trim());
  const rail = `${BRAND_NAME} // Email Interface // V.01`.toUpperCase();

  // Short hero copy reads best centred; a long campaign does not. Centred text
  // gives the eye no consistent left edge to return to, so anything past a
  // couple of short paragraphs switches to ranged-left at a wider measure.
  const blocks = c.message.trim().split(/\n{2,}/);
  const isLong = c.message.trim().length > 240 || blocks.length > 2;
  const align = isLong ? "left" : "center";
  const measure = isLong ? 500 : 460;
  const size = isLong ? 16 : 17;

  const inline = (text: string) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, `<strong style="color: #ffffff; font-weight: 800;">$1</strong>`)
      .replace(/\n/g, "<br/>");

  const paragraph = (html: string) =>
    `<p class="promo-body" style="margin: 0 0 16px; font-size: ${size}px; line-height: 1.72; color: ${IVORY}; font-weight: ${isLong ? 400 : 500}; text-align: ${align};">${html}</p>`;

  // A gold-bulleted table, rather than <ul>, because list indentation and
  // marker colour are unreliable across Outlook and Gmail.
  const bulletList = (items: string[]) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0 0 16px;">
      ${items
        .map(
          (item) => `<tr>
        <td width="18" valign="top" style="padding: 0 0 9px; color: ${GOLD}; font-size: ${size}px; line-height: 1.72;">&#8226;</td>
        <td valign="top" style="padding: 0 0 9px; font-size: ${size}px; line-height: 1.72; color: ${IVORY}; text-align: left;">${inline(item)}</td>
      </tr>`,
        )
        .join("")}
    </table>`;

  const body = blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const bullets = lines.every((l) => /^[-*\u2022]\s+/.test(l));
      if (bullets && lines.length) {
        return bulletList(lines.map((l) => l.replace(/^[-*\u2022]\s+/, "")));
      }
      return paragraph(inline(block));
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <title>${escapeHtml(c.subject)}</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: dark only; supported-color-schemes: dark only; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse !important; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 520px) {
      .promo-shell { width: 100% !important; }
      .promo-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .promo-frame { padding: 10px !important; }
      .promo-title { font-size: 29px !important; line-height: 1.08 !important; }
      .promo-body { font-size: 16px !important; }
      .promo-logo { width: 196px !important; }
      .promo-rail { font-size: 8px !important; letter-spacing: 0.14em !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${INK}; font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK}" style="background-color: ${INK};" role="presentation">
    <tr>
      <td align="center" bgcolor="${INK}" style="padding: 30px 14px 36px; background-color: ${INK};">
        <table class="promo-shell" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;" role="presentation">

          <!-- One frame only. The old version stacked a panel, a frame and a
               card, which read as three boxes fighting each other. -->
          <tr>
            <td class="promo-frame" bgcolor="${PANEL}"
              style="background-color: ${PANEL}; border: 1px solid rgba(241,212,122,0.34); border-radius: 12px; padding: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">

                <tr>
                  <td align="center" style="padding: 9px 12px 11px; border-bottom: 1px solid rgba(241,212,122,0.16);">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
                      <td style="color: ${GOLD_DEEP}; font-size: 12px; line-height: 1; padding-right: 12px;">&#9474;</td>
                      <td class="promo-rail" style="font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: ${GOLD_DEEP}; white-space: nowrap;">${escapeHtml(rail)}</td>
                      <td style="color: ${GOLD_DEEP}; font-size: 12px; line-height: 1; padding-left: 12px;">&#9474;</td>
                    </tr></table>
                  </td>
                </tr>

                <!-- Glow is an enhancement; bgcolor carries Outlook. -->
                <tr>
                  <td align="center" bgcolor="${PANEL}" class="promo-pad"
                    style="background-color: ${PANEL}; background-image: radial-gradient(ellipse 70% 100% at 50% 0%, rgba(241,212,122,0.13) 0%, rgba(10,10,12,0) 72%); padding: 38px 30px 4px;">
                    <img class="promo-logo" src="${brandLogoUrl()}" alt="${BRAND_NAME}" width="250"
                      style="display: block; margin: 0 auto; width: 250px; max-width: 80%; height: auto;" />
                  </td>
                </tr>

                <tr>
                  <td align="center" class="promo-pad" style="padding: 26px 30px 0;">
                    <div style="display: inline-block; border: 1px solid rgba(200,16,46,0.5); background-color: #180A0E; border-radius: 999px; padding: 7px 15px; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: ${RED};">${escapeHtml(c.kicker || "From the club")}</div>
                  </td>
                </tr>

                <tr>
                  <td align="center" class="promo-pad" style="padding: 16px 30px 0;">
                    <h1 class="promo-title" style="margin: 0; font-size: 40px; line-height: 1.04; color: #ffffff; font-weight: 800; letter-spacing: -0.025em;">${escapeHtml(c.title)}</h1>
                  </td>
                </tr>

                <tr><td align="center" style="padding: 22px 0 20px;">${ornament()}</td></tr>

                <!-- Copy on the panel itself, at a comfortable measure. -->
                <tr>
                  <td align="center" class="promo-pad" style="padding: 0 30px;">
                    <table width="${measure}" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: ${measure}px; width: 100%;" role="presentation">
                      <tr><td align="${align}" style="text-align: ${align};">${body}</td></tr>
                    </table>
                  </td>
                </tr>

                ${
                  c.offerHtml
                    ? `<tr>
                  <td align="center" class="promo-pad" style="padding: 12px 30px 0;">
                    <table width="400" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 400px; width: 100%;" role="presentation">
                      <tr>
                        <td align="center" bgcolor="#100E09"
                          style="background-color: #100E09; border: 1px dashed rgba(241,212,122,0.55); border-radius: 10px; padding: 20px 18px;">
                          ${c.offerHtml}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`
                    : ""
                }

                <tr><td align="center" style="padding: 30px 20px 6px;">${ctaButton(ctaLabel, ctaHref)}</td></tr>

                <tr>
                  <td align="center" class="promo-pad" style="padding: 18px 30px 34px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: ${MUTED};">
                      Or head straight to <a href="${escapeHtml(site)}" style="color: ${GOLD}; text-decoration: none; font-weight: 700;">ringtoneriches.co.uk</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td bgcolor="${RED_DEEP}" style="height: 2px; background-color: ${RED_DEEP}; background-image: linear-gradient(90deg, ${RED_DEEP} 0%, ${GOLD} 100%); font-size: 0; line-height: 0; margin-top: 14px;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding: 20px 20px 0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #8b8b93;">
                Questions? <a href="mailto:${FROM_EMAIL}" style="color: ${GOLD}; text-decoration: none; font-weight: 700;">${FROM_EMAIL}</a>
              </p>
              <p style="margin: 0 0 8px; font-size: 11px; line-height: 1.6; color: #5c5c64;">
                You're getting this because you opted in to offers from ${BRAND_NAME}.<br/>
                <a href="${escapeHtml(optOut)}" style="color: #8b8b93; text-decoration: underline;">Manage email preferences</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #4d4d55;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. Play responsibly. 18+</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
