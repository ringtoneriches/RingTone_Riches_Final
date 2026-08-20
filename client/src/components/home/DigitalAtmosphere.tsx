const WARP_STARS = Array.from({ length: 52 }, (_, i) => {
  const angle = (i * 137.508) % 360;
  const far = i % 3 === 0;
  return {
    angle,
    delay: `${((i * 0.23) % 4.6).toFixed(3)}s`,
    duration: far
      ? `${(6.9 + (i % 4) * 0.2).toFixed(2)}s`
      : `${(4.4 + (i % 5) * 0.1).toFixed(2)}s`,
    tone: i % 5 === 0 ? "gold" : i % 7 === 0 ? "red" : "ivory",
    far,
  };
});

type Props = {
  className?: string;
  stars?: boolean;
  layers?: boolean;
};

export default function DigitalAtmosphere({
  className = "",
  stars = false,
  layers = true,
}: Props) {
  if (!layers && !stars) return null;

  return (
    <div className={`rr-atmosphere ${className}`} aria-hidden>
      {layers && (
        <>
          <div className="rr-atmosphere-base" />
          <div className="rr-atmosphere-grid" />
          <div className="rr-atmosphere-streaks" />
          <span className="rr-atmosphere-gold" style={{ top: "18%", left: "12%", animationDelay: "0s" }} />
          <span className="rr-atmosphere-gold" style={{ top: "62%", left: "78%", animationDelay: "3.2s" }} />
        </>
      )}
      {stars && (
        <div className="rr-warp">
          {WARP_STARS.map((star, i) => (
            <span
              key={i}
              className={`rr-warp-star rr-warp-star--${star.tone}${star.far ? " rr-warp-star--far" : ""}`}
              style={{
                ["--warp-a" as string]: `${star.angle}deg`,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
