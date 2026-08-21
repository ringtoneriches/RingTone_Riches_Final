// src/components/auth/Register.tsx
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, XCircle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import AuthPasswordInput from "@/components/auth/AuthPasswordInput";

// ===== SECURITY CONSTANTS =====
const SUSPICIOUS_PATTERNS = [
  // URLs and shortened links
  /https?:\/\/[^\s]+/gi,
  /bit\.ly\/[^\s]+/gi,
  /tinyurl\.com\/[^\s]+/gi,
  /goo\.gl\/[^\s]+/gi,
  /ow\.ly\/[^\s]+/gi,
  /[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}\/[^\s]*/gi,
  /www\.[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}[^\s]*/gi,
  
  // Spam emojis
  /[🚀🔥💎💰💵🎁✨⭐🌟💫💯🤑💸💲🔗📎🔍🌐🕸️🏆👑💪🤩😍✅❌⚠️🏅🎯🥇🥈🥉🎖️💹📈📉🔒🔓🔔📢📣💬🗣️👤👥🔄♻️✅❌⚠️🚫⛔❓❕❗🔴🟢🔵🟡🟣🟠🟤⚫⚪🟥🟧🟨🟩🟦🟪🟫⬛⬜🔺🔻🔸🔹🔶🔷🔰🌀🌙☀️⭐🌠🌌🌈🔥💧❄️☄️🌊🌪️🌫️☁️⛅🌤️🌥️🌦️🌧️⛈️🌨️❄️☃️⛄🌬️💨💭🗯️💬👁️‍🗨️🔇🔊🔉🔈🔔🔕📣📢💤💦💨]/g,
  
  // Spam keywords (Turkish, English, Arabic, etc.)
  /\b(bonus|free|offer|limited|promotion|discount|exclusive|premium|gift|cash|money|earn|make money|investment|profit|win|winner|prize|billion|million|thousand|dollar|euro|pound|btc|bitcoin|crypto|mining|trading|forex|stock|rewards|claim|get now|hurry|urgent|guaranteed|100%|best|top|number one|amazing|incredible|unbelievable|click|here|now|today|act now|don't miss|limited time|exclusive offer|special|promo|code|voucher|coupon|deal|sale|buy|purchase|order|subscribe|follow|like|share|comment|join|sign up|register|apply|get|win|earn|make|money|cash|paypal|venmo|zelle|bank|transfer|wire|deposit|withdraw|investment|trading|signal|group|telegram|whatsapp|instagram|facebook|twitter|tiktok|youtube|discord|link|bio|profile|page|website|blog|vlog|channel)\b/gi,
  
  // Script/HTML injection
  /<[^>]*>/gi,
  /javascript:/gi,
  /on\w+="/gi,
  /alert\(/gi,
  /console\./gi,
  /document\./gi,
  /window\./gi,
  /eval\(/gi,
];

const BOT_PATTERNS = [
  /^\d{10,}$/, // Only digits
  /^[A-Z0-9]{10,}$/, // All caps with numbers
  /^[a-zA-Z0-9]{20,}$/, // Random alphanumeric
  /^(.)\1{5,}$/, // Repeating characters
  /^[0-9a-zA-Z]{8,}$/i, // Random string
  /^[a-f0-9]{16,}$/i, // Hex string
  /^[a-zA-Z]{1}\d{10,}$/, // Letter followed by numbers
];

const ALLOWED_NAME_CHARS = /^[a-zA-Z\s\-'., ]+$/;

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthMonth: string;
  birthYear: string;
  receiveNewsletter: boolean;
  phoneNumber: string;
  referralCode?: string;
  howDidYouFindUs: string;
  redeemCode?: string;
  honeypot: string;
  _timestamp?: number;
};

type FieldError = {
  field: string;
  message: string;
};

export default function Register() {
  const [, setLocation] = useLocation();
  const referralCode = new URLSearchParams(window.location.search).get("ref");
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now()); // For bot detection

  const [formData, setFormData] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthMonth: "",
    birthYear: "",
    receiveNewsletter: false,
    phoneNumber: "",
    referralCode: referralCode || "",
    howDidYouFindUs: "",
    redeemCode: "",
    honeypot: "",
  });

  // ===== SECURITY FUNCTIONS =====

  // Check if string contains suspicious content
  const validateField = (value: string, fieldName: string): string | null => {
    if (!value || value.trim().length === 0) {
      return null; // Empty fields handled separately
    }

    const trimmed = value.trim();

    // Length check
    if (trimmed.length > 50) {
      return `${fieldName} is too long (maximum 50 characters)`;
    }

    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return `${fieldName} contains suspicious content (links, spam keywords, or unauthorized characters)`;
      }
    }

    // Check for bot patterns
    for (const pattern of BOT_PATTERNS) {
      if (pattern.test(trimmed)) {
        return `${fieldName} appears to be automatically generated`;
      }
    }

    // Check for allowed characters (for name fields)
    if (fieldName === "First name" || fieldName === "Last name") {
      if (!ALLOWED_NAME_CHARS.test(trimmed)) {
        return `${fieldName} contains invalid characters (only letters, spaces, hyphens, and apostrophes allowed)`;
      }
    }

    // Check for excessive special characters
    const specialChars = trimmed.match(/[^a-zA-Z0-9\s\-'., ]/g) || [];
    if (specialChars.length > trimmed.length * 0.3) {
      return `${fieldName} contains too many special characters`;
    }

    // Check for excessive repeated characters
    if (/(\w)\1{5,}/.test(trimmed)) {
      return `${fieldName} contains too many repeated characters`;
    }

    // Check for common name patterns (should have at least 2 letters)
    if (fieldName === "First name" || fieldName === "Last name") {
      const letters = trimmed.match(/[a-zA-Z]/g) || [];
      if (letters.length < 2) {
        return `${fieldName} must contain at least 2 letters`;
      }
    }

    return null;
  };

  // Check if email is from suspicious domain
  const validateEmail = (email: string): string | null => {
    if (!email) return "Email is required";
    
    const trimmed = email.trim();
    
    // Basic email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Invalid email format";
    }

    // Check for suspicious email domains (temporary/disposable)
    const suspiciousDomains = [
      'tempmail', 'temp-mail', 'throwaway', 'guerrillamail', 'mailinator',
      '10minutemail', 'yopmail', 'getairmail', 'spamgourmet', 'trashmail',
      'fakeinbox', 'mytempemail', 'mailnator', 'dispostable', 'throwawaymail'
    ];

    const domain = trimmed.split('@')[1]?.toLowerCase();
    if (domain) {
      for (const suspicious of suspiciousDomains) {
        if (domain.includes(suspicious)) {
          return "Please use a real email address (temporary emails are not allowed)";
        }
      }
    }

    return null;
  };

  // Check password strength
  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character";
    return null;
  };

  // Validate phone number
  const validatePhone = (phone: string): string | null => {
    if (!phone) return "Phone number is required";
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (!/^[\+\d]{7,15}$/.test(cleaned)) {
      return "Invalid phone number format";
    }
    return null;
  };

  // Full form validation
  const validateForm = (): FieldError[] => {
    const errors: FieldError[] = [];

    // Check honeypot
    if (formData.honeypot) {
      errors.push({ field: "honeypot", message: "Suspicious activity detected" });
      return errors;
    }

    // Check form submission time (should be at least 2 seconds)
    if (Date.now() - startTime < 2000) {
      errors.push({ field: "form", message: "Form submitted too quickly" });
      return errors;
    }

    // Validate first name
    const firstNameError = validateField(formData.firstName, "First name");
    if (firstNameError) errors.push({ field: "firstName", message: firstNameError });
    else if (!formData.firstName.trim()) errors.push({ field: "firstName", message: "First name is required" });

    // Validate last name
    const lastNameError = validateField(formData.lastName, "Last name");
    if (lastNameError) errors.push({ field: "lastName", message: lastNameError });
    else if (!formData.lastName.trim()) errors.push({ field: "lastName", message: "Last name is required" });

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) errors.push({ field: "email", message: emailError });

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.push({ field: "password", message: passwordError });

    // Validate password confirmation
    if (formData.password && formData.confirmPassword !== formData.password) {
      errors.push({ field: "confirmPassword", message: "Passwords do not match" });
    }

    // Validate phone
    if (formData.phoneNumber) {
      const phoneError = validatePhone(formData.phoneNumber);
      if (phoneError) errors.push({ field: "phoneNumber", message: phoneError });
    }

    // Validate how did you find us
    if (!formData.howDidYouFindUs) {
      errors.push({ field: "howDidYouFindUs", message: "Please select how you found us" });
    }

    // Validate date of birth
    if (!formData.birthMonth || !formData.birthYear) {
      errors.push({ field: "birthDate", message: "Please enter your date of birth" });
    }

    return errors;
  };

  // ===== MUTATIONS =====

  // Find the registerMutation and update it
const registerMutation = useMutation({
  mutationFn: async (data: RegisterForm) => {
    // Remove confirmPassword and honeypot before sending
    const { confirmPassword, honeypot, ...cleanData } = data;
    
    // Add the timestamp to the data being sent
    const submitData = {
      ...cleanData,
      _timestamp: startTime, // Add the page load timestamp
    };
    
    const res = await apiRequest("/api/auth/register", "POST", submitData);
    return res.json();
  },
  onSuccess: (data) => {
    toast({
      title: "✅ Registration Successful!",
      description: "Welcome to RingTone Riches! Please log in.",
    });
    setLocation(`/login`);
  },
  onError: (error: any) => {
    toast({
      variant: "destructive",
      title: "Registration Failed",
      description: error.message || "Failed to create account",
    });
    setIsSubmitting(false);
  },
});

  // ===== HANDLERS =====

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    const errors = validateForm();
    setFieldErrors(errors);

    if (errors.length > 0) {
      // Show first error as toast
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errors[0].message,
      });
      setIsSubmitting(false);
      return;
    }

    // Submit
    registerMutation.mutate(formData);
  };

  const handleFieldChange = (field: keyof RegisterForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setFieldErrors(prev => prev.filter(error => error.field !== field));
  };

  const getFieldError = (field: string): string | undefined => {
    return fieldErrors.find(err => err.field === field)?.message;
  };

  // ===== RENDER =====

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const discoveryOptions = [
    "Word of Mouth",
    "Advertising Screens",
    "Social Media",
    "Street Promotions",
    "Ringtone Riches Vehicles",
    "Flyer",
  ];

  const passwordReqs = [
    { ok: formData.password.length >= 8, label: "8+ characters" },
    { ok: /[A-Z]/.test(formData.password), label: "Uppercase letter" },
    { ok: /[a-z]/.test(formData.password), label: "Lowercase letter" },
    { ok: /[0-9]/.test(formData.password), label: "Number" },
    { ok: /[^A-Za-z0-9]/.test(formData.password), label: "Special character" },
  ];

  return (
    <AuthShell
      wide
      kicker="My account"
      title="CREATE ACCOUNT"
      sub="Takes a minute. Then you’re on the live board."
    >
      <form ref={formRef} onSubmit={handleSubmit} className="rr-auth-form">
        <div className="hidden">
          <label htmlFor="honeypot">Website</label>
          <Input
            id="honeypot"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.honeypot}
            onChange={(e) => handleFieldChange("honeypot", e.target.value)}
          />
        </div>

        <div className="rr-auth-note flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#F1D47A]" />
          <p>
            Names can only use letters, spaces, hyphens and apostrophes. No links, emojis or spam.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rr-auth-field">
            <label htmlFor="firstName" className="rr-auth-label">First name *</label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
              className={`rr-auth-input ${getFieldError("firstName") ? "is-invalid" : ""}`}
              placeholder="First name"
              required
              maxLength={50}
            />
            {getFieldError("firstName") && (
              <p className="rr-auth-error"><XCircle className="h-3 w-3" /> {getFieldError("firstName")}</p>
            )}
          </div>
          <div className="rr-auth-field">
            <label htmlFor="lastName" className="rr-auth-label">Last name *</label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              className={`rr-auth-input ${getFieldError("lastName") ? "is-invalid" : ""}`}
              placeholder="Last name"
              required
              maxLength={50}
            />
            {getFieldError("lastName") && (
              <p className="rr-auth-error"><XCircle className="h-3 w-3" /> {getFieldError("lastName")}</p>
            )}
          </div>
        </div>

        <div className="rr-auth-field">
          <span className="rr-auth-label">Date of birth *</span>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={formData.birthMonth}
              onValueChange={(value) => handleFieldChange("birthMonth", value)}
            >
              <SelectTrigger className={`rr-auth-input ${getFieldError("birthDate") ? "is-invalid" : ""}`}>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={month} value={(index + 1).toString().padStart(2, "0")}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.birthYear}
              onValueChange={(value) => handleFieldChange("birthYear", value)}
            >
              <SelectTrigger className={`rr-auth-input ${getFieldError("birthDate") ? "is-invalid" : ""}`}>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {getFieldError("birthDate") && (
            <p className="rr-auth-error"><XCircle className="h-3 w-3" /> {getFieldError("birthDate")}</p>
          )}
        </div>

        <div className="rr-auth-field">
          <label htmlFor="phoneNumber" className="rr-auth-label">Phone number *</label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
            className={`rr-auth-input ${getFieldError("phoneNumber") ? "is-invalid" : ""}`}
            placeholder="+44 1234 567890"
            required
          />
          {getFieldError("phoneNumber") && (
            <p className="rr-auth-error"><XCircle className="h-3 w-3" /> {getFieldError("phoneNumber")}</p>
          )}
        </div>

        <div className="rr-auth-field">
          <label htmlFor="email" className="rr-auth-label">Email address *</label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            className={`rr-auth-input ${getFieldError("email") ? "is-invalid" : ""}`}
            placeholder="you@email.com"
            required
          />
          {getFieldError("email") && (
            <p className="rr-auth-error"><XCircle className="h-3 w-3" /> {getFieldError("email")}</p>
          )}
        </div>

        <div className="rr-auth-field">
          <label htmlFor="password" className="rr-auth-label">Password *</label>
          <AuthPasswordInput
            id="password"
            value={formData.password}
            onChange={(value) => handleFieldChange("password", value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            required
            invalid={!!getFieldError("password")}
          />
          {getFieldError("password") && (
            <p className="rr-auth-error"><XCircle className="h-3 w-3" /> {getFieldError("password")}</p>
          )}
          <ul className="rr-auth-reqs">
            {passwordReqs.map((req) => (
              <li key={req.label} className={req.ok ? "is-met" : undefined}>
                {req.ok ? "✓" : "•"} {req.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="rr-auth-field">
          <label htmlFor="confirmPassword" className="rr-auth-label">Confirm password *</label>
          <AuthPasswordInput
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(value) => handleFieldChange("confirmPassword", value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
            invalid={!!getFieldError("confirmPassword")}
          />
          {getFieldError("confirmPassword") && (
            <p className="rr-auth-error"><XCircle className="h-3 w-3" /> {getFieldError("confirmPassword")}</p>
          )}
        </div>

        <div className="rr-auth-field">
          <label htmlFor="redeemCode" className="rr-auth-label">Prize / redeem code</label>
          <Input
            id="redeemCode"
            value={formData.redeemCode}
            onChange={(e) => handleFieldChange("redeemCode", e.target.value.toUpperCase().trim())}
            className="rr-auth-input"
            placeholder="Optional"
            maxLength={20}
          />
          <p className="rr-auth-hint">Only if you were given one.</p>
        </div>

        <div className="rr-auth-field">
          <span className="rr-auth-label">How did you find Ringtone Riches? *</span>
          <Select
            value={formData.howDidYouFindUs}
            onValueChange={(value) => handleFieldChange("howDidYouFindUs", value)}
          >
            <SelectTrigger className={`rr-auth-input ${getFieldError("howDidYouFindUs") ? "is-invalid" : ""}`}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {discoveryOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getFieldError("howDidYouFindUs") && (
            <p className="rr-auth-error"><XCircle className="h-3 w-3" /> {getFieldError("howDidYouFindUs")}</p>
          )}
        </div>

        <div className="rr-auth-check-row">
          <Checkbox
            id="newsletter"
            checked={formData.receiveNewsletter}
            onCheckedChange={(checked) => handleFieldChange("receiveNewsletter", checked === true)}
            className="rr-auth-check mt-0.5"
          />
          <label htmlFor="newsletter">
            Send me marketing by email and SMS.
          </label>
        </div>

        <div className="rr-auth-note">
          Your data is used to run your account and entries, as set out in our{" "}
          <Link href="/privacy-policy" className="rr-auth-link">privacy policy</Link>.
          By registering you also agree to the{" "}
          <Link href="/termsAndConditions" className="rr-auth-link">terms</Link>.
        </div>

        <button
          type="submit"
          className="rr-cta inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]"
          disabled={registerMutation.isPending || isSubmitting}
        >
          {registerMutation.isPending ? "Creating account…" : "Create account"}
        </button>

        <div className="rr-auth-footer">
          <p>Already have an account?</p>
          <Link href="/login">
            <span className="rr-auth-ghost cursor-pointer">Log in</span>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}