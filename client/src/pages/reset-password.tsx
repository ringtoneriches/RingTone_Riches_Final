import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);
  const { toast } = useToast();

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const { data: tokenData, isLoading: verifyingToken, error: tokenError } = useQuery({
    queryKey: ["/api/auth/verify-reset-token", token],
    queryFn: async () => {
      if (!token) throw new Error("No reset token provided");
      const res = await fetch(`/api/auth/verify-reset-token/${token}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Invalid token");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const resetMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const res = await apiRequest("/api/auth/reset-password", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      setResetComplete(true);
      toast({
        title: "Password Reset Successfully",
        description: "You can now log in with your new password.",
      });
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all fields",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must contain at least one uppercase letter",
      });
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must contain at least one lowercase letter",
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must contain at least one number",
      });
      return;
    }

    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid Token",
        description: "No reset token found",
      });
      return;
    }

    resetMutation.mutate({ token, newPassword });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h3>
              <p className="text-gray-300 mb-4">
                This password reset link is invalid or incomplete.
              </p>
              <Link href="/forgot-password">
                <Button className="bg-yellow-600 hover:bg-ringtone-700" data-testid="button-request-new-link">
                  REQUEST NEW RESET LINK
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-white">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-xl font-bold text-white mb-2">Reset Link Expired</h3>
              <p className="text-gray-300 mb-4">
                {(tokenError as Error).message || "This reset link has expired or is invalid."}
              </p>
              <Link href="/forgot-password">
                <Button className="bg-yellow-600 hover:bg-ringtone-700" data-testid="button-request-new-link-error">
                  REQUEST NEW RESET LINK
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">RESET PASSWORD</h1>
        </div>

        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-text text-center flex items-center justify-center gap-2">
              <Lock className="w-6 h-6" />
              Create New Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!resetComplete ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {tokenData?.email && (
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-gray-300">
                      Resetting password for: <strong className="text-white">{tokenData.email}</strong>
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="newPassword" className="text-white">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="bg-white text-black border-gray-300 mt-2"
                    required
                    data-testid="input-new-password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="bg-white text-black border-gray-300 mt-2"
                    required
                    data-testid="input-confirm-password"
                  />
                </div>

                <div className="p-3 bg-gray-900/50 border border-gray-600 rounded-lg">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Password Requirements:</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase letter (A-Z)</li>
                    <li>• Contains lowercase letter (a-z)</li>
                    <li>• Contains number (0-9)</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yellow-600 hover:bg-ringtone-700 text-white font-bold"
                  disabled={resetMutation.isPending}
                  data-testid="button-reset-password"
                >
                  {resetMutation.isPending ? "RESETTING..." : "RESET PASSWORD"}
                </Button>

                <div className="text-center border-t border-gray-600 pt-4">
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
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-white mb-2">Password Reset Complete!</h3>
                  <p className="text-gray-300 mb-4">
                    Your password has been successfully reset.
                  </p>
                  <p className="text-sm text-gray-400">
                    Redirecting you to login page...
                  </p>
                </div>

                <Link href="/login">
                  <Button className="bg-yellow-600 hover:bg-ringtone-700" data-testid="button-go-to-login">
                    GO TO LOGIN
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}