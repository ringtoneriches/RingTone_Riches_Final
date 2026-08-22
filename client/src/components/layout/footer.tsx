import { Facebook, Headphones, Instagram } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import PaymentMethodIcons from "@/components/layout/PaymentMethodIcons";
import { Link } from "wouter";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M14.5 3c.4 2.3 1.8 4.1 4 4.6v2.3c-1.4 0-2.7-.4-3.8-1.2v6.8c0 3.5-2.8 6.5-6.4 6.5S2 19 2 15.5 4.8 9 8.3 9c.4 0 .8 0 1.2.1v2.5c-.4-.1-.8-.2-1.2-.2-2.1 0-3.8 1.7-3.8 3.9s1.7 3.9 3.8 3.9 3.6-1.6 3.8-3.6V3h2.4Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="rr-footer py-12 sm:py-16">
      <div className="relative z-[1] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-5">
            <Link href="/">
              <BrandLogo
                className="h-16 w-auto cursor-pointer object-contain sm:h-20"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/45">
              Real competitions. Real winners. Real prizes.
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.facebook.com/profile.php?id=61579695463356"
                className="rr-footer-social"
                data-testid="link-facebook"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/ringtoneriches?igsh=MTVyMnJvZ2w4dGZ2Zw%3D%3D&utm_source=qr"
                className="rr-footer-social"
                data-testid="link-instagram"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@ringtone.riches?_t=ZN-90jrPt73hTi&_r=1"
                className="rr-footer-social"
                data-testid="link-tiktok"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            </div>
            <PaymentMethodIcons />
          </div>

          <div>
            <h4 className="rr-footer-heading">Useful information</h4>
            <div className="space-y-2.5">
              <a href="/" className="rr-footer-link" data-testid="link-competitions">
                Competitions
              </a>
              <a href="/#how-it-works" className="rr-footer-link" data-testid="link-how-it-works">
                How It Works
              </a>
              <a href="/be-aware" className="rr-footer-link" data-testid="link-be-aware">
                Be Aware
              </a>
            </div>
          </div>

          <div>
            <h4 className="rr-footer-heading">Policies</h4>
            <div className="space-y-2.5">
              <a href="/termsAndConditions" className="rr-footer-link" data-testid="link-terms">
                Terms & Conditions
              </a>
              <a href="/privacy-policy" className="rr-footer-link" data-testid="link-privacy">
                Privacy & Cookies Policy
              </a>
            </div>
          </div>

          <div>
            <h4 className="rr-footer-heading">Contact</h4>
            <Link href="/wallet?tab=support">
              <span className="rr-header-ghost inline-flex h-11 cursor-pointer gap-2 px-4">
                <Headphones className="h-4 w-4" />
                Support
              </span>
            </Link>
          </div>
        </div>

        <div className="rr-footer-legal mt-10 flex flex-col items-center gap-1.5 border-t pt-6 text-center text-xs sm:text-sm">
          <p>&copy; 2026 Ringtone Riches. All rights reserved.</p>
          <p>
            Please play responsibly. 18+ Only.{" "}
            <a
              href="https://www.begambleaware.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              BeGambleAware.org
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
