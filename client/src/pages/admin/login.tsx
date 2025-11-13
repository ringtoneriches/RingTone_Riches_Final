import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Mail, Sparkles } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
        toast({
          title: "Welcome Back!",
          description: "Logged in successfully as admin.",
        });
        setLocation("/admin");
      } else {
        // Non-admin user logged in - log them out and show error
        await apiRequest("/api/auth/logout", "POST");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <Card className="relative w-full max-w-md border-yellow-400/20 bg-gray-900/90 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-8">
          {/* Logo/Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Admin Panel
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Ringtone Riches Administration
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-yellow-400" />
                Email Address
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@ringtoneriches.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                data-testid="input-admin-email"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-gray-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-400" />
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter your admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                data-testid="input-admin-password"
                autoComplete="current-password"
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-6 shadow-lg hover:shadow-xl transition-all"
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-3 border-black border-t-transparent rounded-full" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Login to Admin Panel
                </div>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-yellow-400" />
              Secure admin access only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
