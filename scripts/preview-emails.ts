/**
 * Render the campaign email to dist-preview/ so it can be eyeballed in a
 * browser without sending anything. Touches no database and no Resend.
 *
 *   npx tsx scripts/preview-emails.ts && open dist-preview/index.html
 */
import fs from "node:fs";
import path from "node:path";
import { renderPromotionalEmail } from "../server/emails/promotional-email";

const GOLD = "#F1D47A";
const out = path.resolve("dist-preview");
fs.mkdirSync(out, { recursive: true });

const samples = [
  {
    file: "promo-announcement.html",
    label: "Announcement",
    html: renderPromotionalEmail({
      subject: "Have you missed us?",
      title: "HAVE YOU MISSED US? 👀",
      message:
        "Because Ringtone Riches has had a serious upgrade… and there's A LOT going on. 🔥\n\nNew games, bigger instant wins, and prizes dropping every single day. Come and see what changed while you were away.",
      ctaLabel: "See now",
    }),
  },
  {
    file: "promo-discount.html",
    label: "Discount code",
    html: renderPromotionalEmail({
      subject: "20% off your next play",
      title: "20% OFF YOUR NEXT PLAY",
      message: "A little something for sticking with us. Use this at checkout on any competition.",
      kicker: "Members only",
      ctaLabel: "Claim it now",
      offerHtml: `
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: ${GOLD};">Discount code</div>
        <div style="margin-top: 12px; font-size: 30px; font-weight: 800; letter-spacing: 0.12em; color: #ffffff; font-family: 'Courier New', Consolas, monospace;">RICHES20</div>
        <p style="margin: 12px 0 0; font-size: 15px; color: #EFEAE1;">Save 20% on your next play.</p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #8b8b93;">Expires 31 October 2026</p>`,
    }),
  },
  {
    file: "promo-bonus.html",
    label: "Bonus",
    html: renderPromotionalEmail({
      subject: "There's £5 waiting in your wallet",
      title: "THERE'S £5 WAITING FOR YOU",
      message: "We've topped up your wallet. Spend it on any competition or instant win — no catch.",
      kicker: "On the house",
      ctaLabel: "Claim it now",
      offerHtml: `
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: ${GOLD};">Bonus</div>
        <div style="margin-top: 10px; font-size: 34px; font-weight: 800; color: ${GOLD}; line-height: 1;">£5</div>
        <p style="margin: 10px 0 0; font-size: 17px; font-weight: 700; color: #ffffff;">500 Ringtone Points</p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #8b8b93;">Until 31 October 2026</p>`,
    }),
  },
  {
    file: "promo-long.html",
    label: "Long campaign (what the owner showed)",
    html: renderPromotionalEmail({
      subject: "Have you missed us?",
      title: "HAVE YOU MISSED US? 👀",
      message: [
        "Because Ringtone Riches has had a **serious upgrade**… and there's A LOT going on. 🔥",
        "We've spent the last few months rebuilding the whole thing from the ground up. Faster games, cleaner checkout, and instant wins that actually feel instant. Here's what's landed while you were away:",
        "- **Six new games** — Voltz, Pop, Plinko, Royal, Retro Spin and Scratch, all with instant cash prizes\n- **Bigger jackpots** — up to £7,500 on a single play\n- **Ringtone Points** on every entry, redeemable against any competition\n- **Faster payouts** — winnings land in your wallet the moment you reveal",
        "And there's more coming. We're adding new competitions every week, with daily free entries for members and a weekly draw that's climbing fast.",
        "Your account is exactly where you left it — same login, same balance, same points. Pick up right where you stopped.",
      ].join("\n\n"),
      ctaLabel: "See what's new",
    }),
  },
];

for (const s of samples) fs.writeFileSync(path.join(out, s.file), s.html);

fs.writeFileSync(
  path.join(out, "index.html"),
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Campaign email</title>
<style>
  body { margin:0; background:#16161a; color:#e9e9ee; font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif; padding:26px; }
  h1 { font-size:17px; margin:0 0 3px; }
  .sub { color:#9a9aa3; margin:0 0 22px; font-size:13px; }
  .grid { display:flex; flex-wrap:wrap; gap:22px; align-items:flex-start; }
  .item h2 { font-size:11px; text-transform:uppercase; letter-spacing:.14em; color:#F1D47A; margin:0 0 9px; }
  .item.narrow h2 { color:#7fd0a8; }
  iframe { border:0; border-radius:10px; background:#050505; display:block; }
  .wide iframe { width:640px; height:880px; }
  .narrow iframe { width:390px; height:880px; }
</style></head><body>
<h1>Ringtone Riches — campaign email</h1>
<p class="sub">server/emails/promotional-email.ts. Nothing was sent.</p>
<div class="grid">
${samples.map((s) => `  <div class="item wide"><h2>${s.label}</h2><iframe src="${s.file}"></iframe></div>`).join("\n")}
  <div class="item narrow"><h2>Announcement — mobile 390px</h2><iframe src="promo-announcement.html"></iframe></div>
</div>
</body></html>`,
);

console.log(`Rendered ${samples.length} campaign previews to ${out}/index.html`);
