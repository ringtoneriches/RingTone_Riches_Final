import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "featured" | "card";
  className?: string;
};

export default function ChaserBorder({ children, variant = "card", className = "" }: Props) {
  return (
    <div className={`rr-chaser rr-chaser--${variant} ${className}`}>
      <div className="rr-chaser-beam" aria-hidden />
      <div className="relative z-[1] h-full rounded-[inherit] overflow-hidden">{children}</div>
      <div className="rr-inner-glow" aria-hidden />
    </div>
  );
}
