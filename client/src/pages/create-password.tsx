import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import AuthShell from "@/components/auth/AuthShell";
import BrandWait from "@/components/brand/BrandWait";
import AuthPasswordInput from "@/components/auth/AuthPasswordInput";

export default function CreatePasswordPage() {
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: { isGuestAccount?: boolean } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/register");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/guest/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save password.");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Password saved",
        description: "We sent a 6-digit code to verify this email.",
      });
      const email = encodeURIComponent(data.email || "");
      setLocation(email ? `/verify-email?email=${email}` : "/verify-email");
    } catch (error: any) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <BrandWait
        mode="page"
        kicker="Account"
        headline="Opening account"
        subtitle="Checking your session."
      />
    );
  }

  return (
    <AuthShell
      kicker="Save tickets"
      title="CREATE A PASSWORD"
      sub="Keep this checkout on your email so you can come back on any device."
    >
      <form onSubmit={submit} className="rr-auth-form">
        {!user?.isGuestAccount && !isLoading ? (
          <p className="text-sm text-white/55">This account already has a password.</p>
        ) : (
          <>
            <div className="rr-auth-field">
              <label htmlFor="password" className="rr-auth-label">Password</label>
              <AuthPasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="rr-auth-field">
              <label htmlFor="confirm" className="rr-auth-label">Confirm password</label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rr-auth-input"
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rr-cta inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]"
            >
              {busy ? "Saving…" : "Save account"}
            </button>
          </>
        )}
      </form>
    </AuthShell>
  );
}
