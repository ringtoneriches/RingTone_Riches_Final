import { Moon, Sun } from "lucide-react";
import { useSiteTheme } from "@/hooks/useSiteTheme";

type Props = {
  className?: string;
};

export default function ThemeToggle({ className = "" }: Props) {
  const { effective, toggle } = useSiteTheme();
  const isDay = effective === "day";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rr-theme-toggle ${className}`}
      aria-label={isDay ? "Switch to night mode" : "Switch to day mode"}
      data-testid="button-theme-toggle"
    >
      {isDay ? <Moon className="h-4 w-4" strokeWidth={2.2} /> : <Sun className="h-4 w-4" strokeWidth={2.2} />}
    </button>
  );
}
