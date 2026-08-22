import { SiApplepay, SiGooglepay, SiPaypal, SiVisa } from "react-icons/si";

function MastercardMark() {
  return (
    <svg viewBox="0 0 40 24" width="34" height="20" aria-hidden>
      <circle cx="15" cy="12" r="9.2" fill="#EB001B" />
      <circle cx="25" cy="12" r="9.2" fill="#F79E1B" />
      <path d="M20 4.6a9.2 9.2 0 0 1 0 14.8 9.2 9.2 0 0 1 0-14.8Z" fill="#FF5F00" />
    </svg>
  );
}

const METHODS = [
  {
    name: "Visa",
    wide: false,
    node: <SiVisa color="#1A1F71" size={36} aria-hidden />,
  },
  {
    name: "Mastercard",
    wide: false,
    node: <MastercardMark />,
  },
  {
    name: "PayPal",
    wide: false,
    node: <SiPaypal color="#003087" size={22} aria-hidden />,
  },
  {
    name: "Google Pay",
    wide: true,
    node: <SiGooglepay color="#5F6368" size={40} aria-hidden />,
  },
  {
    name: "Apple Pay",
    wide: true,
    node: <SiApplepay color="#111111" size={40} aria-hidden />,
  },
] as const;

export default function PaymentMethodIcons({ className = "" }: { className?: string }) {
  return (
    <ul className={`payment-icons ${className}`} aria-label="Accepted payment methods">
      {METHODS.map(({ name, wide, node }) => (
        <li key={name}>
          <span className={wide ? "is-wide" : undefined} title={name}>
            {node}
            <span className="sr-only">{name}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
