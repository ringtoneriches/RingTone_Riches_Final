import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import AuthShell from "@/components/auth/AuthShell";
import AuthPasswordInput from "@/components/auth/AuthPasswordInput";

type LoginData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw {
          status: res.status,
          data: responseData,
        };
      }

      return responseData;
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      const status = error.status;
      const errorData = error.data || { message: "Something went wrong" };

      if (status === 403 && errorData.message?.includes("verify your email")) {
        toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "Please verify your email address before logging in. Check your inbox for the verification code.",
        });
        setLocation(`/verify-email?email=${encodeURIComponent(email)}`);
      } else if (status === 403 && errorData.message?.includes("account has been closed")) {
        toast({
          variant: "destructive",
          title: "Account Closed",
          description: "This account has been closed. Please contact support for assistance.",
        });
      } else if (status === 403 && errorData.message?.includes("temporarily suspended")) {
        const endsAt = errorData.endsAt ? new Date(errorData.endsAt).toLocaleDateString() : "later";
        toast({
          variant: "destructive",
          title: "Account Suspended",
          description: `Your account is temporarily suspended until ${endsAt} for wellbeing reasons.`,
        });
      } else if (status === 401) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorData.message || "Invalid email or password. Please check your credentials.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorData.message || "Something went wrong. Please try again.",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all required fields",
      });
      return;
    }

    loginMutation.mutate({ email, password, rememberMe });
  };

  return (
    <AuthShell
      kicker="My account"
      title="LOG IN"
      sub="Enter your details to get back to the live board."
    >
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
            autoComplete="email"
            required
          />
        </div>

        <div className="rr-auth-field">
          <label htmlFor="password" className="rr-auth-label">Password</label>
          <AuthPasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            required
          />
        </div>

        <div className="rr-auth-split">
          <div className="rr-auth-check-row">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              className="rr-auth-check mt-0.5"
            />
            <label htmlFor="remember">Remember me</label>
          </div>
          <Link href="/forgot-password" className="rr-auth-link">
            Lost your password?
          </Link>
        </div>

        <button
          type="submit"
          className="rr-cta inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.12em]"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in…" : "Log in"}
        </button>

        <div className="rr-auth-footer">
          <p>Don’t have an account?</p>
          <Link href="/register">
            <span className="rr-auth-ghost cursor-pointer">Create account</span>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
