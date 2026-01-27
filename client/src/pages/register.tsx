// Update your Register component
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// Remove WelcomeBonusPopup import - we'll show this after verification

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthMonth: string;
  birthYear: string;
  receiveNewsletter: boolean;
  phoneNumber: string;
  referralCode?: string;
  howDidYouFindUs: string;
};

type RegisterResponse = {
  message: string;
  userId: string;
  email: string;
  emailSent: boolean;
  expiresIn: string;
  requiresVerification: boolean;
};

export default function Register() {
  const [, setLocation] = useLocation();
  const referralCode = new URLSearchParams(window.location.search).get("ref");
  const [formData, setFormData] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    birthMonth: "",
    birthYear: "",
    receiveNewsletter: false,
    phoneNumber: "",
    referralCode: "",
    howDidYouFindUs: "",
  });
  const { toast } = useToast();

  const discoveryOptions = [
    "Word of Mouth",
    "Advertising Screens",
    "Social Media",
    "Street Promotions",
    "Ringtone Riches Vehicles",
  ];

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("/api/auth/register", "POST", data);
      return res.json();
    },
    onSuccess: (data: RegisterResponse) => {
      // Show success message
      toast({
        title: "Registration Successful!",
        description: "Please check your email for verification code.",
      });
      
      // Redirect to verification page with email
      setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to create account",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all required fields",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address",
      });
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    if (!formData.howDidYouFindUs) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please tell us how you found out about Ringtone Riches",
      });
      return;
    }

    registerMutation.mutate({
      ...formData,
      referralCode: referralCode || "",
    });
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* MY ACCOUNT Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">MY ACCOUNT</h1>
        </div>

        <Card className="bg-black/40 border-ringtone-900/20 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-text text-center">REGISTER</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">First name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="bg-white text-black border-gray-300 mt-2"
                    data-testid="input-first-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white">Last name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="bg-white text-black border-gray-300 mt-2"
                    data-testid="input-last-name"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <Label className="text-white">Date of Birth</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Select value={formData.birthMonth} onValueChange={(value) => setFormData(prev => ({ ...prev, birthMonth: value }))}>
                    <SelectTrigger className="bg-white text-black" data-testid="select-birth-month">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={month} value={(index + 1).toString().padStart(2, '0')}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.birthYear} onValueChange={(value) => setFormData(prev => ({ ...prev, birthYear: value }))}>
                    <SelectTrigger className="bg-white text-black" data-testid="select-birth-year">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <Label htmlFor="phoneNumber" className="text-white">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="bg-white text-black border-gray-300 mt-2"
                  data-testid="input-phone-number"
                  placeholder="+44 1234 567890"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-white">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white text-black border-gray-300 mt-2"
                  data-testid="input-email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-white text-black border-gray-300 mt-2"
                  data-testid="input-password"
                  required
                />
              </div>

            <div>
              <Label className="text-white">
                How did you find out about Ringtone Riches?
              </Label>

              <Select
                value={formData.howDidYouFindUs}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, howDidYouFindUs: value }))
                }
              >
                <SelectTrigger className="bg-white text-black mt-2">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>

                <SelectContent>
                  {discoveryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


              {/* Newsletter Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={formData.receiveNewsletter}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, receiveNewsletter: checked === true }))}
                  data-testid="checkbox-newsletter"
                />
                <Label htmlFor="newsletter" className="text-white text-sm">
                  If you would like to receive our marketing via Email and SMS please tick here.
                </Label>
              </div>

              {/* Privacy Notice */}
              <div className="text-xs text-gray-400">
                Your personal data will be used to support your experience throughout this 
                website, to manage access to your account, and for other purposes described in 
                our privacy policy.
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-ringtone-700 text-white font-bold"
                data-testid="button-register"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "CREATING ACCOUNT..." : "REGISTER"}
              </Button>

              {/* Login Link */}
              <div className="text-center border-t border-gray-600 pt-4">
                <p className="text-white text-sm mb-2">Already have an account?</p>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="border-ringtone-600 text-ringtone-400 hover:bg-ringtone-600/20 hover:text-ringtone-400"
                    data-testid="button-go-to-login"
                  >
                    SIGN IN
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