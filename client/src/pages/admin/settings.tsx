import AdminLayout from "@/components/admin/admin-layout";
import {
  CreditCard,
  Mail,
  FileText,
  DollarSign,
  Globe,
  Shield,
  User,
  Lock,
  Gift,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

type PlatformSettings = {
  id: string;
  commissionRate: string;
  minimumTopUp: string;
  signupBonusEnabled: boolean;
  signupBonusCash: string;
  signupBonusPoints: number;
  updatedAt: Date;
};

export default function AdminSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [commissionRate, setCommissionRate] = useState("0");
  const [minimumTopUp, setMinimumTopUp] = useState("10");
  
  // Signup bonus state
  const [signupBonusEnabled, setSignupBonusEnabled] = useState(false);
  const [signupBonusCash, setSignupBonusCash] = useState("0.00");
  const [signupBonusPoints, setSignupBonusPoints] = useState("0");

  // Admin credentials state
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load settings from backend with real-time polling
  const { data: settings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ["/api/admin/settings"],
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates on admin page
    staleTime: 0, // Always consider stale for admin data
  });

  // Update form state when settings load
  useEffect(() => {
    if (settings) {
      setCommissionRate(settings.commissionRate || "0");
      setMinimumTopUp(settings.minimumTopUp || "10");
      setSignupBonusEnabled(settings.signupBonusEnabled || false);
      setSignupBonusCash(settings.signupBonusCash || "0.00");
      setSignupBonusPoints(String(settings.signupBonusPoints || 0));
    }
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: {
      commissionRate: string;
      minimumTopUp: string;
      signupBonusEnabled: boolean;
      signupBonusCash: string;
      signupBonusPoints: number;
    }) => {
      return await apiRequest("/api/admin/settings", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your platform settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate({
      commissionRate,
      minimumTopUp,
      signupBonusEnabled,
      signupBonusCash,
      signupBonusPoints: parseInt(signupBonusPoints) || 0,
    });
  };

  const handleCancel = () => {
    if (settings) {
      setCommissionRate(settings.commissionRate || "0");
      setMinimumTopUp(settings.minimumTopUp || "10");
      setSignupBonusEnabled(settings.signupBonusEnabled || false);
      setSignupBonusCash(settings.signupBonusCash || "0.00");
      setSignupBonusPoints(String(settings.signupBonusPoints || 0));
    }
  };

  // Change username mutation
  const changeUsernameMutation = useMutation({
    mutationFn: async (data: { newUsername: string }) => {
      return await apiRequest("/api/admin/change-username", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setNewUsername("");
      toast({
        title: "Username Updated",
        description: "Your admin username has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update username",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      return await apiRequest("/api/admin/change-password", "POST", data);
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Updated",
        description: "Your admin password has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const handleChangeUsername = () => {
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new username",
        variant: "destructive",
      });
      return;
    }

    changeUsernameMutation.mutate({ newUsername: newUsername.trim() });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Match backend validation: min 8 chars, uppercase, lowercase, number
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one uppercase letter",
        variant: "destructive",
      });
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one lowercase letter",
        variant: "destructive",
      });
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast({
        title: "Error",
        description: "Password must contain at least one number",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-foreground"
              data-testid="heading-settings"
            >
              Platform Settings
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Configure your competition platform
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Signup Bonus Settings Card */}
          <Card className="border-border bg-card md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-yellow-400" />
                Signup Bonus Settings
              </CardTitle>
              <CardDescription>
                Configure welcome bonuses for new users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Enable Signup Bonus</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically credit new users with welcome bonus
                  </p>
                </div>
                <Switch
                  checked={signupBonusEnabled}
                  onCheckedChange={setSignupBonusEnabled}
                  data-testid="switch-signup-bonus"
                />
              </div>

              {signupBonusEnabled && (
                <div className="grid gap-4 md:grid-cols-2 p-4 border border-yellow-400/20 rounded-lg bg-yellow-400/5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-bonus-cash">Bonus Cash (£)</Label>
                    <Input
                      id="signup-bonus-cash"
                      type="number"
                      placeholder="0.00"
                      value={signupBonusCash}
                      onChange={(e) => setSignupBonusCash(e.target.value)}
                      min="0"
                      step="0.01"
                      data-testid="input-signup-bonus-cash"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cash amount credited to new users
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-bonus-points">Bonus Points</Label>
                    <Input
                      id="signup-bonus-points"
                      type="number"
                      placeholder="0"
                      value={signupBonusPoints}
                      onChange={(e) => setSignupBonusPoints(e.target.value)}
                      min="0"
                      step="1"
                      data-testid="input-signup-bonus-points"
                    />
                    <p className="text-xs text-muted-foreground">
                      RingTone Points credited to new users
                    </p>
                  </div>
                  <div className="md:col-span-2 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-md">
                    <p className="text-sm text-foreground font-medium">
                      💡 Bonus Preview
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      New users will receive{" "}
                      {parseFloat(signupBonusCash || "0") > 0 && (
                        <span className="text-yellow-400 font-semibold">
                          £{parseFloat(signupBonusCash).toFixed(2)}
                        </span>
                      )}
                      {parseFloat(signupBonusCash || "0") > 0 &&
                        parseInt(signupBonusPoints || "0") > 0 &&
                        " and "}
                      {parseInt(signupBonusPoints || "0") > 0 && (
                        <span className="text-yellow-400 font-semibold">
                          {signupBonusPoints} RingTone Points
                        </span>
                      )}
                      {parseFloat(signupBonusCash || "0") === 0 &&
                        parseInt(signupBonusPoints || "0") === 0 &&
                        "no bonus (set amounts above)"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Account Management Card */}
          <Card className="border-border bg-card md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-400" />
                Admin Account Management
              </CardTitle>
              <CardDescription>
                Change your admin username and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Change Username Section */}
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-yellow-400" />
                    <h3 className="font-semibold text-foreground">
                      Change Username
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current-username">Current Username</Label>
                    <Input
                      id="current-username"
                      type="text"
                      value={user?.firstName || "Admin"}
                      disabled
                      className="bg-muted"
                      data-testid="input-current-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-username">New Username</Label>
                    <Input
                      id="new-username"
                      type="text"
                      placeholder="Enter new username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      data-testid="input-new-username"
                    />
                  </div>
                  <Button
                    onClick={handleChangeUsername}
                    disabled={
                      changeUsernameMutation.isPending || !newUsername.trim()
                    }
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                    data-testid="button-change-username"
                  >
                    {changeUsernameMutation.isPending
                      ? "Updating..."
                      : "Update Username"}
                  </Button>
                </div>

                {/* Change Password Section */}
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-yellow-400" />
                    <h3 className="font-semibold text-foreground">
                      Change Password
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      data-testid="input-current-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      data-testid="input-new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      data-testid="input-confirm-password"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      changePasswordMutation.isPending ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                    data-testid="button-change-password"
                  >
                    {changePasswordMutation.isPending
                      ? "Updating..."
                      : "Update Password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-yellow-400" />
                Payment Gateway
              </CardTitle>
              <CardDescription>Cashflows payment configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cashflows-api-key">API Key</Label>
                <Input
                  id="cashflows-api-key"
                  type="password"
                  placeholder="••••••••"
                  defaultValue="configured"
                  disabled
                  data-testid="input-cashflows-api-key"
                />
                <p className="text-xs text-muted-foreground">
                  Configured via environment variables
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cashflows-config-id">Configuration ID</Label>
                <Input
                  id="cashflows-config-id"
                  type="text"
                  placeholder="Enter configuration ID"
                  defaultValue="configured"
                  disabled
                  data-testid="input-cashflows-config-id"
                />
                <p className="text-xs text-muted-foreground">
                  Configured via environment variables
                </p>
              </div>
            </CardContent>
          </Card> */}

          {/* <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                Platform Fees
              </CardTitle>
              <CardDescription>Commission and fee settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                <Input
                  id="commission-rate"
                  type="number"
                  placeholder="5.0"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  data-testid="input-commission-rate"
                />
                <p className="text-xs text-muted-foreground">
                  Percentage taken from each transaction
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-topup">Minimum Top-Up (£)</Label>
                <Input
                  id="min-topup"
                  type="number"
                  placeholder="5.00"
                  value={minimumTopUp}
                  onChange={(e) => setMinimumTopUp(e.target.value)}
                  min="1"
                  step="1"
                  data-testid="input-min-topup"
                />
              </div>
            </CardContent>
          </Card> */}
          {/* 
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-yellow-400" />
                Email Notifications
              </CardTitle>
              <CardDescription>Email service configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  type="text"
                  placeholder="smtp.example.com"
                  data-testid="input-smtp-host"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-email">Sender Email</Label>
                <Input
                  id="sender-email"
                  type="email"
                  placeholder="noreply@ringtone-riches.com"
                  data-testid="input-sender-email"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email service not yet configured
              </p>
            </CardContent>
          </Card> */}

          {/* <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-yellow-400" />
                Platform Information
              </CardTitle>
              <CardDescription>Website details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  type="text"
                  placeholder="Ringtone Riches"
                  defaultValue="Ringtone Riches"
                  data-testid="input-platform-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  placeholder="support@ringtone-riches.com"
                  data-testid="input-support-email"
                />
              </div>
            </CardContent>
          </Card> */}

          {/* <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-400" />
                Legal & Compliance
              </CardTitle>
              <CardDescription>Terms and policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Terms & Conditions</p>
                  <p className="text-sm text-muted-foreground">Manage legal terms</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-edit-terms">
                  Edit
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Privacy Policy</p>
                  <p className="text-sm text-muted-foreground">Update privacy terms</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-edit-privacy">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card> */}

          {/* <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                Security Settings
              </CardTitle>
              <CardDescription>Platform security options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  placeholder="168"
                  defaultValue="168"
                  min="1"
                  max="720"
                  data-testid="input-session-timeout"
                />
                <p className="text-xs text-muted-foreground">
                  Currently set to 1 week (168 hours)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                <Input
                  id="max-login-attempts"
                  type="number"
                  placeholder="5"
                  defaultValue="5"
                  min="3"
                  max="10"
                  data-testid="input-max-login-attempts"
                />
              </div>
            </CardContent>
          </Card> */}
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saveSettingsMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            data-testid="button-save-settings"
          >
            {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
