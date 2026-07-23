// src/components/auth/Register.tsx
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Shield, XCircle } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">MY ACCOUNT</h1>
        </div>

        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-text text-center">REGISTER</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {/* ===== HONEYPOT FIELD (Hidden) ===== */}
              <div className="hidden">
                <Label htmlFor="honeypot">Website</Label>
                <Input
                  id="honeypot"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.honeypot}
                  onChange={(e) => handleFieldChange("honeypot", e.target.value)}
                />
              </div>

              {/* ===== SECURITY INFO ===== */}
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 flex items-start gap-2">
                <Shield className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400">
                  🔒 For security, names must contain only letters, spaces, hyphens, and apostrophes.
                  No links, emojis, or spam keywords allowed.
                </p>
              </div>

              {/* ===== NAME FIELDS ===== */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">First name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleFieldChange("firstName", e.target.value)}
                    className={`bg-white text-black border-gray-300 mt-2 ${getFieldError("firstName") ? "border-red-500" : ""}`}
                    placeholder="Enter first name"
                    required
                    maxLength={50}
                  />
                  {getFieldError("firstName") && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> {getFieldError("firstName")}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white">Last name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleFieldChange("lastName", e.target.value)}
                    className={`bg-white text-black border-gray-300 mt-2 ${getFieldError("lastName") ? "border-red-500" : ""}`}
                    placeholder="Enter last name"
                    required
                    maxLength={50}
                  />
                  {getFieldError("lastName") && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> {getFieldError("lastName")}
                    </p>
                  )}
                </div>
              </div>

              {/* ===== DATE OF BIRTH ===== */}
              <div>
                <Label className="text-white">Date of Birth *</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Select 
                    value={formData.birthMonth} 
                    onValueChange={(value) => handleFieldChange("birthMonth", value)}
                  >
                    <SelectTrigger className={`bg-white text-black ${getFieldError("birthDate") ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={month} value={(index + 1).toString().padStart(2, '0')}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={formData.birthYear} 
                    onValueChange={(value) => handleFieldChange("birthYear", value)}
                  >
                    <SelectTrigger className={`bg-white text-black ${getFieldError("birthDate") ? "border-red-500" : ""}`}>
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
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {getFieldError("birthDate")}
                  </p>
                )}
              </div>

              {/* ===== PHONE NUMBER ===== */}
              <div>
                <Label htmlFor="phoneNumber" className="text-white">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                  className={`bg-white text-black border-gray-300 mt-2 ${getFieldError("phoneNumber") ? "border-red-500" : ""}`}
                  placeholder="+44 1234 567890"
                  required
                />
                {getFieldError("phoneNumber") && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {getFieldError("phoneNumber")}
                  </p>
                )}
              </div>

              {/* ===== EMAIL ===== */}
              <div>
                <Label htmlFor="email" className="text-white">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className={`bg-white text-black border-gray-300 mt-2 ${getFieldError("email") ? "border-red-500" : ""}`}
                  placeholder="you@example.com"
                  required
                />
                {getFieldError("email") && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {getFieldError("email")}
                  </p>
                )}
              </div>

              {/* ===== PASSWORD ===== */}
              <div>
                <Label htmlFor="password" className="text-white">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  className={`bg-white text-black border-gray-300 mt-2 ${getFieldError("password") ? "border-red-500" : ""}`}
                  placeholder="Min 8 chars with uppercase, lowercase, number, special"
                  required
                />
                {getFieldError("password") && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {getFieldError("password")}
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  Must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
                </p>
              </div>

              {/* ===== CONFIRM PASSWORD ===== */}
              <div>
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                  className={`bg-white text-black border-gray-300 mt-2 ${getFieldError("confirmPassword") ? "border-red-500" : ""}`}
                  placeholder="Confirm your password"
                  required
                />
                {getFieldError("confirmPassword") && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {getFieldError("confirmPassword")}
                  </p>
                )}
              </div>

              {/* ===== REDEEM CODE ===== */}
              <div>
                <Label htmlFor="redeemCode" className="text-white">Prize/Redeem Code</Label>
                <Input
                  id="redeemCode"
                  value={formData.redeemCode}
                  onChange={(e) => handleFieldChange("redeemCode", e.target.value.toUpperCase().trim())}
                  className="bg-white text-black border-gray-300 mt-2"
                  placeholder="e.g., 5PZNC"
                  maxLength={20}
                />
                <p className="text-gray-400 text-xs mt-1">
                  Enter any promotional code you received
                </p>
              </div>

              {/* ===== HOW DID YOU FIND US ===== */}
              <div>
                <Label className="text-white">How did you find out about Ringtone Riches? *</Label>
                <Select
                  value={formData.howDidYouFindUs}
                  onValueChange={(value) => handleFieldChange("howDidYouFindUs", value)}
                >
                  <SelectTrigger className={`bg-white text-black mt-2 ${getFieldError("howDidYouFindUs") ? "border-red-500" : ""}`}>
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
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {getFieldError("howDidYouFindUs")}
                  </p>
                )}
              </div>

              {/* ===== NEWSLETTER ===== */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={formData.receiveNewsletter}
                  onCheckedChange={(checked) => handleFieldChange("receiveNewsletter", checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="newsletter" className="text-white text-sm leading-tight">
                  If you would like to receive our marketing via Email and SMS please tick here.
                </Label>
              </div>

              {/* ===== PRIVACY NOTICE ===== */}
              <div className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded-lg">
                <p>
                  Your personal data will be used to support your experience throughout this 
                  website, to manage access to your account, and for other purposes described in 
                  our privacy policy.
                </p>
                <p className="mt-1 text-yellow-400">
                  🔒 All data is encrypted and protected.
                </p>
              </div>

              {/* ===== REGISTER BUTTON ===== */}
              <Button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-ringtone-700 text-white font-bold"
                disabled={registerMutation.isPending || isSubmitting}
              >
                {registerMutation.isPending ? "CREATING ACCOUNT..." : "REGISTER"}
              </Button>

              {/* ===== LOGIN LINK ===== */}
              <div className="text-center border-t border-gray-600 pt-4">
                <p className="text-white text-sm mb-2">Already have an account?</p>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="border-ringtone-600 text-ringtone-400 hover:bg-ringtone-600/20 hover:text-ringtone-400"
                  >
                    SIGN IN
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}