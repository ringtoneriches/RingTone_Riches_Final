import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

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
      // Use fetch directly to avoid the throwing issue
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const responseData = await res.json();

      // If not successful, throw with status and data
      if (!res.ok) {
        throw {
          status: res.status,
          data: responseData,
        };
      }

      return responseData;
    },
    onSuccess: (data) => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      const status = error.status;
      const errorData = error.data || { message: "Something went wrong" };
      
      console.log("Login error:", status, errorData);

      // Handle different error types
      if (status === 403 && errorData.message?.includes("verify your email")) {
        toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "Please verify your email address before logging in. Check your inbox for the verification code.",
        });
        setLocation(`/verify-email?email=${encodeURIComponent(email)}`);
      }
      else if (status === 403 && errorData.message?.includes("account has been closed")) {
        toast({
          variant: "destructive",
          title: "Account Closed",
          description: "This account has been closed. Please contact support for assistance.",
        });
      }
      else if (status === 403 && errorData.message?.includes("temporarily suspended")) {
        const endsAt = errorData.endsAt ? new Date(errorData.endsAt).toLocaleDateString() : "later";
        toast({
          variant: "destructive",
          title: "Account Suspended",
          description: `Your account is temporarily suspended until ${endsAt} for wellbeing reasons.`,
        });
      }
      else if (status === 401) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorData.message || "Invalid email or password. Please check your credentials.",
        });
      }
      else {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">MY ACCOUNT</h1>
        </div>

        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-text text-center">LOGIN</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="bg-white text-black border-gray-300 mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white text-black border-gray-300 mt-2"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-white text-sm">
                  Remember me
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-ringtone-700 text-white font-bold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "LOGGING IN..." : "LOG IN"} 
              </Button>

              <div className="text-center mt-2">
                <Link href="/forgot-password">
                  <a className="text-ringtone-400 hover:text-ringtone-300 text-sm">
                    Lost your password?
                  </a>
                </Link>
              </div>

              <div className="text-center border-t border-gray-600 pt-4">
                <p className="text-white text-sm mb-2">Don't have an account?</p>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="border-ringtone-600 text-ringtone-400 hover:bg-ringtone-600/10 hover:text-ringtone-400"
                  >
                    CREATE ACCOUNT
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}