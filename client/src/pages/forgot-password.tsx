import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("/api/auth/forgot-password", "POST", { email });
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Email Sent",
        description: "If an account exists with this email, a password reset link has been sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        variant: "destructive",
        title: "Missing Email",
        description: "Please enter your email address",
      });
      return;
    }

    resetMutation.mutate(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">FORGOT PASSWORD</h1>
        </div>

        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-text text-center flex items-center justify-center gap-2">
              <Mail className="w-6 h-6" />
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white text-black border-gray-300 mt-2"
                    required
                    data-testid="input-email"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yellow-600 hover:bg-ringtone-700 text-white font-bold"
                  disabled={resetMutation.isPending}
                  data-testid="button-submit"
                >
                  {resetMutation.isPending ? "SENDING..." : "SEND RESET LINK"}
                </Button>

                <div className="text-center border-t border-gray-600 pt-4">
                  <p className="text-white text-sm mb-2">Remember your password?</p>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="border-ringtone-600 text-ringtone-400 hover:bg-ringtone-600/10"
                      data-testid="button-back-to-login"
                    >
                      BACK TO LOGIN
                    </Button>
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-6 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="text-4xl mb-4">✉️</div>
                  <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
                  <p className="text-gray-300 mb-4">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-gray-400">
                    If you don't see the email, check your spam folder. The link will expire in 1 hour.
                  </p>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <p className="text-white text-sm mb-2">Didn't receive the email?</p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="border-ringtone-600 text-ringtone-400 hover:bg-ringtone-600/10"
                    data-testid="button-try-again"
                  >
                    TRY AGAIN
                  </Button>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="border-ringtone-600 text-ringtone-400 hover:bg-ringtone-600/10"
                      data-testid="button-back-to-login-success"
                    >
                      BACK TO LOGIN
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}