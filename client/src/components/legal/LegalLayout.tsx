import { type ReactNode, useEffect, useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";

export const SUPPORT_EMAIL = "support@ringtoneriches.co.uk";

export type LegalTocItem = { id: string; label: string };

export function useActiveSection(ids: readonly string[]) {
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

export function MailLink({ children }: { children?: ReactNode }) {
  return <a href={`mailto:${SUPPORT_EMAIL}`}>{children ?? SUPPORT_EMAIL}</a>;
}

export function Section({
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

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="rr-legal-bullets">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <aside className="rr-legal-note">{children}</aside>;
}

export function RelatedLegal({ exclude }: { exclude: "privacy" | "play" | "aware" | "terms" }) {
  const links = [
    { id: "terms" as const, href: "/termsAndConditions", label: "Terms & Conditions", hint: "How competitions and prizes work" },
    { id: "privacy" as const, href: "/privacy-policy", label: "Privacy & cookies", hint: "How we use your data" },
    { id: "aware" as const, href: "/be-aware", label: "Be Aware", hint: "Tools to stay in control" },
    { id: "play" as const, href: "/play-responsible", label: "Play responsibly", hint: "Keep it fun and within budget" },
  ].filter((link) => link.id !== exclude);

  return (
    <div className="rr-legal-related">
      {links.map((link) => (
        <a key={link.id} href={link.href} className="rr-legal-related-card">
          <span>{link.label}</span>
          <em>{link.hint}</em>
        </a>
      ))}
    </div>
  );
}

function Toc({ items, activeId }: { items: readonly LegalTocItem[]; activeId: string }) {
  return (
    <nav className="rr-legal-toc" aria-label="On this page">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#F1D47A]">
        On this page
      </p>
      {items.map((item) => (
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

type LegalLayoutProps = {
  badge?: string;
  title: string;
  sub: string;
  updated?: string;
  toc: readonly LegalTocItem[];
  children: ReactNode;
};

export default function LegalLayout({
  badge = "Legal",
  title,
  sub,
  updated,
  toc,
  children,
}: LegalLayoutProps) {
  const ids = toc.map((item) => item.id);
  const activeId = useActiveSection(ids);

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
                {badge}
              </span>
            </div>
            <h1 className="font-prize text-[2.15rem] leading-[0.92] text-white sm:text-6xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-white/50 sm:text-base">{sub}</p>
            {updated ? (
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#F1D47A]">
                Last updated: {updated}
              </p>
            ) : null}
          </header>

          <details className="rr-legal-jump mt-8 lg:hidden">
            <summary>Jump to a section</summary>
            <div className="mt-3 grid gap-1 px-1 pb-2">
              {toc.map((item) => (
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
            <aside className="hidden lg:block lg:sticky lg:top-[7.25rem] lg:self-start">
              <Toc items={toc} activeId={activeId} />
            </aside>
            <article className="rr-legal-prose max-w-3xl">{children}</article>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
