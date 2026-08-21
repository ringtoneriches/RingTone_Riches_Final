export default function BrandIntro() {
  return (
    <section className="rr-brand-intro" data-testid="section-brand-intro">
      <div className="rr-brand-eq" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="rr-eq-bar rr-brand-eq-bar"
            style={{
              animationDelay: `${(i % 9) * 0.11}s`,
              height: `${10 + ((i * 17) % 22)}px`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="rr-brand-kicker">Welcome to Ringtone Riches</p>
        <h1 className="rr-brand-title">
          MAKING YOU
          <span> RINGTONE RICHER</span>
        </h1>
        <p className="rr-brand-sub">
          Prize competitions. Instant wins. Cash in the account.
        </p>
      </div>
    </section>
  );
}
