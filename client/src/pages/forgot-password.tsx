import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

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
    <AuthShell
      kicker="Account recovery"
      title="FORGOT PASSWORD"
      sub={
        submitted
          ? "Check your inbox and follow the reset link."
          : "We’ll email you a link if that address is on an account."
      }
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="rr-auth-form">
          <div className="rr-auth-field">
            <label htmlFor="email" className="rr-auth-label">Email address</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="rr-auth-input"
              required
              data-testid="input-email"
            />
            <p className="rr-auth-hint">
              Enter the email on your Ringtone Riches account.
            </p>
          </div>

          <button
            type="submit"
            className="rr-cta inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]"
            disabled={resetMutation.isPending}
            data-testid="button-submit"
          >
            {resetMutation.isPending ? "Sending…" : "Send reset link"}
          </button>

          <div className="rr-auth-footer">
            <p>Remember your password?</p>
            <Link href="/login">
              <span className="rr-auth-ghost cursor-pointer" data-testid="button-back-to-login">
                Back to login
              </span>
            </Link>
          </div>
        </form>
      ) : (
        <div className="rr-auth-form">
          <div className="rr-auth-note rr-auth-note--ok rr-auth-status">
            <Mail className="mx-auto h-7 w-7 text-[#00b67a]" />
            <h3>Check your email</h3>
            <p>
              If an account exists for <strong>{email}</strong>, a reset link is on its way.
              Check spam if you don’t see it. The link expires in 1 hour.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="rr-auth-ghost"
            data-testid="button-try-again"
          >
            Try again
          </button>

          <Link href="/login">
            <span className="rr-auth-ghost cursor-pointer" data-testid="button-back-to-login-success">
              Back to login
            </span>
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
