import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  testId?: string;
  invalid?: boolean;
};

export default function AuthPasswordInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  autoComplete = "current-password",
  testId,
  invalid,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="rr-auth-password">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        data-testid={testId}
        className={`rr-auth-input ${invalid ? "is-invalid" : ""}`}
      />
      <button
        type="button"
        className="rr-auth-eye"
        onClick={() => setShow((prev) => !prev)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
