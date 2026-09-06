import logoDark from "@assets/Ringtone_Riches_Logo_Dark.png";
import logoLight from "@assets/Ringtone_Riches_Logo_Light.png";
import { useSiteTheme } from "@/hooks/useSiteTheme";

type Props = {
  className?: string;
  testId?: string;
  /** Use when the logo sits on a surface that does not follow the page theme (e.g. the dark footer). */
  force?: "night" | "day";
};

export default function BrandLogo({ className, testId, force }: Props) {
  const { effective } = useSiteTheme();
  const mode = force ?? effective;

  return (
    <img
      src={mode === "day" ? logoLight : logoDark}
      alt="RingTone Riches"
      className={className}
      data-testid={testId}
      loading="eager"
    />
  );
}
