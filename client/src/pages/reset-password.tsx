import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import AuthPasswordInput from "@/components/auth/AuthPasswordInput";

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

  const reqs = [
    { ok: newPassword.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Z]/.test(newPassword), label: "One uppercase letter" },
    { ok: /[a-z]/.test(newPassword), label: "One lowercase letter" },
    { ok: /[0-9]/.test(newPassword), label: "One number" },
  ];

  if (!token) {
    return (
      <AuthShell kicker="Account recovery" title="INVALID LINK" sub="This reset link is missing or incomplete.">
        <div className="rr-auth-form">
          <div className="rr-auth-note rr-auth-note--warn rr-auth-status">
            <ShieldAlert className="mx-auto h-7 w-7 text-[#FF263D]" />
            <h3>Invalid reset link</h3>
            <p>Request a new one and we’ll email a fresh link.</p>
          </div>
          <Link href="/forgot-password">
            <span className="rr-cta inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]" data-testid="button-request-new-link">
              Request new reset link
            </span>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (verifyingToken) {
    return (
      <AuthShell kicker="Account recovery" title="CHECKING LINK" sub="Hang on — we’re verifying this reset link.">
        <div className="rr-auth-status">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F1D47A]" />
          <p className="mt-4">Verifying reset link…</p>
        </div>
      </AuthShell>
    );
  }

  if (tokenError) {
    return (
      <AuthShell kicker="Account recovery" title="LINK EXPIRED" sub="This reset link is no longer valid.">
        <div className="rr-auth-form">
          <div className="rr-auth-note rr-auth-note--warn rr-auth-status">
            <ShieldAlert className="mx-auto h-7 w-7 text-[#FF263D]" />
            <h3>Reset link expired</h3>
            <p>{(tokenError as Error).message || "This reset link has expired or is invalid."}</p>
          </div>
          <Link href="/forgot-password">
            <span className="rr-cta inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]" data-testid="button-request-new-link-error">
              Request new reset link
            </span>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Account recovery"
      title="NEW PASSWORD"
      sub="Set a strong password, then you’re back in."
    >
      {!resetComplete ? (
        <form onSubmit={handleSubmit} className="rr-auth-form">
          {tokenData?.email ? (
            <div className="rr-auth-note">
              Resetting password for <strong>{tokenData.email}</strong>
            </div>
          ) : null}

          <div className="rr-auth-field">
            <label htmlFor="newPassword" className="rr-auth-label">New password</label>
            <AuthPasswordInput
              id="newPassword"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter new password"
              autoComplete="new-password"
              required
              testId="input-new-password"
            />
          </div>

          <div className="rr-auth-field">
            <label htmlFor="confirmPassword" className="rr-auth-label">Confirm password</label>
            <AuthPasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
              testId="input-confirm-password"
            />
          </div>

          <ul className="rr-auth-reqs">
            {reqs.map((req) => (
              <li key={req.label} className={req.ok ? "is-met" : undefined}>
                {req.ok ? "✓" : "•"} {req.label}
              </li>
            ))}
          </ul>

          <button
            type="submit"
            className="rr-cta inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]"
            disabled={resetMutation.isPending}
            data-testid="button-reset-password"
          >
            {resetMutation.isPending ? "Resetting…" : "Reset password"}
          </button>

          <div className="rr-auth-footer">
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
            <CheckCircle2 className="mx-auto h-7 w-7 text-[#00b67a]" />
            <h3>Password reset</h3>
            <p>Your password is updated. Taking you to login…</p>
          </div>
          <Link href="/login">
            <span className="rr-cta inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]" data-testid="button-go-to-login">
              Go to login
            </span>
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
