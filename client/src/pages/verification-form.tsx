import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WelcomeBonusPopup } from "@/components/welcome-bonus-popup";
import { Mail, RefreshCw, Lock, Shield } from "lucide-react";

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
          setLocation("/login");
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
      setLocation("/login");
    }, 1000);
  };

  const isOtpExpired = statusData?.otpExpired || (timeLeft !== null && timeLeft <= 0);
  const canResend = !statusData?.emailVerified && (isOtpExpired || resendMutation.isSuccess);

  // Show loading while fetching status
  if (timeLeft === null && !statusData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-ringtone-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">EMAIL VERIFICATION</h1>
          <p className="text-gray-400 mt-2">Check your email for the 6-digit code</p>
        </div>

        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-text text-center flex items-center justify-center gap-2">
              <Shield className="w-6 h-6" />
              Verify Your Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-ringtone-900/30 rounded-lg border border-ringtone-800">
              <div className="flex items-center justify-center gap-3">
                <Mail className="w-5 h-5 text-ringtone-400" />
                <p className="text-white font-medium">{email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-white text-center block mb-4">
                  Enter the 6-digit code sent to your email
                </Label>
                <div className="flex justify-center space-x-2 mb-6">
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
                      className="w-14 h-14 text-3xl font-bold text-center border-2 border-ringtone-700 bg-black/50 text-white rounded-xl focus:border-ringtone-400 focus:ring-2 focus:ring-ringtone-400/30 outline-none transition-all"
                      disabled={loading}
                      data-testid={`otp-input-${index}`}
                    />
                  ))}
                </div>

                <div className="text-center mb-4">
                  <div className="inline-flex items-center space-x-2 bg-black/50 px-4 py-2 rounded-full border border-ringtone-800">
                    <Lock className="w-4 h-4 text-ringtone-400" />
                    <span className="font-mono text-lg font-bold text-white">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  {timeLeft !== null && timeLeft > 0 && (
                    <p className="text-gray-400 text-sm mt-2">
                      Code expires in {formatTime(timeLeft)}
                      {timeLeft < 120 && (
                        <span className="text-red-400 ml-1">⚠️ Hurry!</span>
                      )}
                    </p>
                  )}
                  {isOtpExpired && (
                    <p className="text-red-400 text-sm mt-2">
                      OTP has expired. Please request a new one.
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || otp.join('').length !== 6 || verifyMutation.isPending || isOtpExpired}
                className="w-full bg-yellow-600 hover:bg-ringtone-700 text-white font-bold py-6 text-lg"
                data-testid="verify-button"
              >
                {loading || verifyMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : isOtpExpired ? (
                  "OTP Expired"
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="pt-6 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Didn't receive the code?</p>
                  <Button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading || (!isOtpExpired && !resendMutation.isSuccess)}
                    variant="outline"
                    className="border-ringtone-700 text-ringtone-400 hover:bg-ringtone-900/30 hover:text-ringtone-300"
                    data-testid="resend-button"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${resendLoading ? 'animate-spin' : ''}`} />
                    {resendLoading ? 'Sending...' : 'Resend OTP'}
                  </Button>
                  {!isOtpExpired && !resendMutation.isSuccess && timeLeft !== null && timeLeft > 0 && (
                    <p className="text-gray-500 text-sm mt-2">
                      Resend available in {formatTime(timeLeft)}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-ringtone-900/20 border border-ringtone-800 rounded-xl">
                <p className="text-gray-300 text-sm text-center">
                  <strong>Note:</strong> Check your spam folder if you don't see the email.
                  The OTP is valid for 10 minutes only.
                </p>
              </div>

              <div className="text-center border-t border-gray-700 pt-6">
                <p className="text-white text-sm mb-2">Already verified?</p>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="border-ringtone-600 text-ringtone-400 hover:bg-ringtone-600/20 hover:text-ringtone-400"
                  >
                    Go to Login
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <WelcomeBonusPopup
          isOpen={showBonusPopup}
          onClose={handleBonusPopupClose}
          bonusCash={bonusData.cash}
          bonusPoints={bonusData.points}
          userName={bonusData.userName}
        />
      </div>
    </div>
  );
};