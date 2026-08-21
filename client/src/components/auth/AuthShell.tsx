import { Link } from "wouter";
import Header from "@/components/layout/header";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import BrandLogo from "@/components/layout/BrandLogo";

type Props = {
  kicker: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
  wide?: boolean;
};

export default function AuthShell({ kicker, title, sub, children, wide = false }: Props) {
  return (
    <div className="rr-auth-page min-h-screen text-foreground relative overflow-x-hidden">
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
        <Header />
        <main className={`rr-auth-main ${wide ? "is-wide" : ""}`}>
          <aside className="rr-auth-brand" aria-hidden>
            <Link href="/">
              <BrandLogo className="h-14 w-auto object-contain" />
            </Link>
            <p className="rr-auth-brand-kicker">{kicker}</p>
            <h2 className="rr-auth-brand-title font-prize">YOUR SHOT STARTS HERE</h2>
            <p className="rr-auth-brand-sub">
              Prize competitions. Instant wins. Cash in the account.
            </p>
            <ul className="rr-auth-brand-points">
              <li>Real prizes, live on the board</li>
              <li>Tickets in. Result out.</li>
              <li>Winners get paid</li>
            </ul>
          </aside>

          <section className="rr-auth-card">
            <p className="rr-auth-kicker">{kicker}</p>
            <h1 className="rr-auth-title font-prize">{title}</h1>
            {sub ? <p className="rr-auth-sub">{sub}</p> : null}
            <div className="rr-auth-body">{children}</div>
          </section>
        </main>
      </div>
    </div>
  );
}
