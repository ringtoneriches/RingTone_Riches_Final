import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Mail } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import "@/components/admin/admin-theme.css";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("/api/auth/login", "POST", credentials);
      const data = await response.json();
      return data;
    },
    onSuccess: async (data) => {
      if (data.user && data.user.isAdmin) {
        // Sync auth cache before navigating so maintenance gate sees isAdmin immediately
        queryClient.setQueryData(["/api/auth/user"], data.user);
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Welcome Back!",
          description: "Logged in successfully as admin.",
        });
        setLocation("/admin");
      } else {
        // Non-admin user logged in - log them out and show error
        await apiRequest("/api/auth/logout", "POST");
        queryClient.setQueryData(["/api/auth/user"], null);
        toast({
          title: "Access Denied",
          description: "You must be an admin to access this area.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="rr-auth-page fixed inset-0 z-10 overflow-y-auto text-white">
      <DigitalAtmosphere className="rr-atmosphere--page" />

      <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandLogo force="night" className="h-14 w-auto sm:h-16" />
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF263D] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF263D]" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                Restricted area
              </span>
            </span>
          </div>

          <div className="rr-auth-card">
            <p className="rr-auth-kicker">Ringtone Riches Administration</p>
            <h1 className="rr-auth-title font-prize uppercase">Admin Panel</h1>
            <p className="rr-auth-sub">Sign in with your admin account to manage the platform.</p>

            <form onSubmit={handleSubmit} className="rr-auth-form rr-auth-body">
              {/* Email Field */}
              <div className="rr-auth-field">
                <Label htmlFor="admin-email" className="rr-auth-label flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#F1D47A]" />
                  Email Address
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rr-auth-input"
                  data-testid="input-admin-email"
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="rr-auth-field">
                <Label htmlFor="admin-password" className="rr-auth-label flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-[#F1D47A]" />
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rr-auth-input"
                  data-testid="input-admin-password"
                  autoComplete="current-password"
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="rr-cta mt-1 h-12 w-full rounded-xl text-sm font-black uppercase tracking-[0.16em]"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FFF8EE] border-t-transparent" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Login to Admin Panel
                  </div>
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <p className="mt-5 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/40">
              <Lock className="h-3 w-3 text-[#F1D47A]" />
              Secure admin access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
