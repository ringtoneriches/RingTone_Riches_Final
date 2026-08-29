import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WelcomeBonusPopup } from "@/components/welcome-bonus-popup";
import { Mail, RefreshCw, Lock, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import BrandWait from "@/components/brand/BrandWait";

interface VerificationFormProps {
  email: string;
  onVerified?: () => void;
}

type VerifyResponse = {
  message: string;
  verified: boolean;
  bonusesApplied: {
    cash: number;
    points: number;
    referral: boolean;
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
};

export const VerificationForm: React.FC<VerificationFormProps> = ({ email, onVerified }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [bonusData, setBonusData] = useState<{
    cash: number;
    points: number;
    userName: string;
  }>({ cash: 0, points: 0, userName: "" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Check verification status on mount
  const { data: statusData, refetch } = useQuery({
    queryKey: ['verification-status', email],
    queryFn: async () => {
      const res = await fetch(`/api/auth/verification-status/${encodeURIComponent(email)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch verification status");
      }
      return res.json();
    },
    enabled: !!email,
    refetchInterval: 10000, // Check every 10 seconds for timer sync
    refetchOnWindowFocus: true,
  });

  // Sync timer with backend
  useEffect(() => {
    if (statusData?.timeRemaining !== undefined) {
      setTimeLeft(statusData.timeRemaining);
    } else if (statusData?.otpExpired) {
      setTimeLeft(0);
    }
  }, [statusData]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00";
    if (seconds <= 0) return "00:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const verifyMutation = useMutation({
    mutationFn: async (otpString: string) => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otpString,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw {
          status: res.status,
          data: data,
        };
      }

      return data;
    },
    onSuccess: (data: VerifyResponse) => {
      setLoading(false);
      
      toast({
        title: "Email Verified!",
        description: "Your email has been verified successfully.",
      });
      
      const hasBonus = data.bonusesApplied.cash > 0 || data.bonusesApplied.points > 0;
      
      if (hasBonus) {
        setBonusData({
          cash: data.bonusesApplied.cash,
          points: data.bonusesApplied.points,
          userName: `${data.user.firstName} ${data.user.lastName}`.trim() || data.user.firstName || "there",
        });
        setShowBonusPopup(true);
      } else {
        setTimeout(() => {
          setLocation("/my-plays");
        }, 1500);
      }
      
      onVerified?.();
    },
    onError: (error: any) => {
      setLoading(false);
      
      const errorData = error.data || { message: "Verification failed" };
      
      if (error.status === 400) {
        toast({
          variant: "destructive",
          title: "Invalid OTP",
          description: errorData.message || "The OTP you entered is invalid or expired.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: errorData.message || "Something went wrong. Please try again.",
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast({
        variant: "destructive",
        title: "Incomplete Code",
        description: "Please enter all 6 digits of the OTP.",
      });
      return;
    }

    setLoading(true);
    verifyMutation.mutate(otpString);
  };

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw {
          status: res.status,
          data: data,
        };
      }

      return data;
    },
    onSuccess: () => {
      setResendLoading(false);
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
      
      // Refetch status to get new timer
      refetch();
      
      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
    },
    onError: (error: any) => {
      setResendLoading(false);
      
      const errorData = error.data || { message: "Failed to resend OTP" };
      
      if (error.status === 429) {
        toast({
          variant: "destructive",
          title: "Too Many Requests",
          description: errorData.message || "Please wait before requesting another OTP.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Resend Failed",
          description: errorData.message || "Failed to send new OTP. Please try again.",
        });
      }
    },
  });

  const handleResendOtp = () => {
    setResendLoading(true);
    resendMutation.mutate();
  };

  const handleBonusPopupClose = () => {
    setShowBonusPopup(false);
    setTimeout(() => {
      setLocation("/my-plays");
    }, 1000);
  };

  const isOtpExpired = statusData?.otpExpired || (timeLeft !== null && timeLeft <= 0);
  const canResend = !statusData?.emailVerified && (isOtpExpired || resendMutation.isSuccess);

  // Show loading while fetching status
  if (timeLeft === null && !statusData) {
    return (
      <AuthShell kicker="Verify email" title="CHECKING" sub="Loading your verification status.">
        <BrandWait quiet headline="Checking verification" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Verify email"
      title="ENTER YOUR CODE"
      sub="We sent a 6-digit code to your inbox."
    >
      <form onSubmit={handleSubmit} className="rr-auth-form">
        <div className="rr-auth-note flex items-center justify-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-[#F1D47A]" />
          <span>{email}</span>
        </div>

        <div className="rr-auth-field">
          <span className="rr-auth-label" style={{ textAlign: "center" }}>6-digit code</span>
          <div className="rr-auth-otp">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="rr-auth-input"
                disabled={loading}
                data-testid={`otp-input-${index}`}
              />
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="rr-auth-timer">
            <Lock className="h-3.5 w-3.5 text-[#F1D47A]" />
            {formatTime(timeLeft)}
          </div>
          {timeLeft !== null && timeLeft > 0 && (
            <p className="rr-auth-hint mt-2">
              Code expires in {formatTime(timeLeft)}
              {timeLeft < 120 ? " — hurry." : ""}
            </p>
          )}
          {isOtpExpired && (
            <p className="rr-auth-error mt-2 justify-center">OTP has expired. Request a new one.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join("").length !== 6 || verifyMutation.isPending || isOtpExpired}
          className="rr-cta inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]"
          data-testid="verify-button"
        >
          {loading || verifyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : isOtpExpired ? (
            "OTP expired"
          ) : (
            "Verify email"
          )}
        </button>

        <div className="rr-auth-footer">
          <p>Didn’t get the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendLoading || (!isOtpExpired && !resendMutation.isSuccess)}
            className="rr-auth-ghost"
            data-testid="resend-button"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${resendLoading ? "animate-spin" : ""}`} />
            {resendLoading ? "Sending…" : "Resend code"}
          </button>
          {!isOtpExpired && !resendMutation.isSuccess && timeLeft !== null && timeLeft > 0 && (
            <p className="rr-auth-hint mt-2">Resend available in {formatTime(timeLeft)}</p>
          )}
        </div>

        <div className="rr-auth-note">
          Check spam if it’s not in your inbox. The code is valid for 10 minutes.
        </div>

        <div className="rr-auth-footer">
          <p>Already verified?</p>
          <Link href="/login">
            <span className="rr-auth-ghost cursor-pointer">Go to login</span>
          </Link>
        </div>
      </form>

      <WelcomeBonusPopup
        isOpen={showBonusPopup}
        onClose={handleBonusPopupClose}
        bonusCash={bonusData.cash}
        bonusPoints={bonusData.points}
        userName={bonusData.userName}
      />
    </AuthShell>
  );
};