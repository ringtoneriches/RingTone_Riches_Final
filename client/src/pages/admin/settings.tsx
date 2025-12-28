import AdminLayout from "@/components/admin/admin-layout";
import {
  Gift,
  User,
  Lock,
  Gamepad2,
  CircleDot,
  Sparkles,
  Settings2,
  Loader2,
  ExternalLink,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

type PlatformSettings = {
  id: string;
  commissionRate: string;
  minimumTopUp: string;
  signupBonusEnabled: boolean;
  signupBonusCash: string;
  signupBonusPoints: number;
  updatedAt: Date;
};

type GameConfig = {
  isVisible?: boolean;
  isActive?: boolean;
};

export default function AdminSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [commissionRate, setCommissionRate] = useState("0");
  const [minimumTopUp, setMinimumTopUp] = useState("10");
  
  const [signupBonusEnabled, setSignupBonusEnabled] = useState(false);
  const [signupBonusCash, setSignupBonusCash] = useState("0.00");
  const [signupBonusPoints, setSignupBonusPoints] = useState("0");

  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: settings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ["/api/admin/settings"],
    refetchInterval: 5000,
    staleTime: 0,
  });

  const { data: popConfig } = useQuery<GameConfig>({
    queryKey: ["/api/admin/game-pop-config"],
  });

  useEffect(() => {
    if (settings) {
      setCommissionRate(settings.commissionRate || "0");
      setMinimumTopUp(settings.minimumTopUp || "10");
      setSignupBonusEnabled(settings.signupBonusEnabled || false);
      setSignupBonusCash(settings.signupBonusCash || "0.00");
      setSignupBonusPoints(String(settings.signupBonusPoints || 0));
    }
  }, [settings]);

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
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="heading-settings">
            Platform Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your competition platform and manage games
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2" data-testid="tab-general">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2" data-testid="tab-games">
              <Gamepad2 className="w-4 h-4" />
              <span className="hidden sm:inline">Games</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2" data-testid="tab-account">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="border-border bg-card">
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
                        Bonus Preview
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

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saveSettingsMutation.isPending}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    data-testid="button-save-settings"
                  >
                    {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card 
                className="border-border bg-card cursor-pointer transition-all hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/10"
                onClick={() => navigate("/admin/spin-wheel")}
                data-testid="card-spin-wheel"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/20 to-yellow-500/20">
                      <CircleDot className="w-6 h-6 text-yellow-400" />
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-bold text-lg text-foreground mb-1">Spin Wheel</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure wheel segments, prizes, and probabilities
                  </p>
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Settings
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="border-border bg-card cursor-pointer transition-all hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/10"
                onClick={() => navigate("/admin/scratch-card")}
                data-testid="card-scratch-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-bold text-lg text-foreground mb-1">Scratch Card</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure scratch card prizes and win rates
                  </p>
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Settings
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="border-border bg-card cursor-pointer transition-all hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/10"
                onClick={() => navigate("/admin/ringtone-pop")}
                data-testid="card-ringtone-pop"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/20 to-green-500/20">
                      <Gamepad2 className="w-6 h-6 text-red-400" />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={popConfig?.isActive 
                        ? "bg-green-500/10 text-green-400 border-green-500/30" 
                        : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                      }
                    >
                      {popConfig?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-bold text-lg text-foreground mb-1">Ringtone Pop</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure balloon prizes, costs, and visibility
                  </p>
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-yellow-400" />
                  Quick Game Overview
                </CardTitle>
                <CardDescription>
                  At-a-glance status of all games on your platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CircleDot className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="font-medium">Spin Wheel</p>
                        <p className="text-xs text-muted-foreground">26 segments configured</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate("/admin/spin-wheel")}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium">Scratch Card</p>
                        <p className="text-xs text-muted-foreground">Multiple prize tiers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate("/admin/scratch-card")}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium">Ringtone Pop</p>
                        <p className="text-xs text-muted-foreground">Christmas balloon game</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={popConfig?.isActive 
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }
                      >
                        {popConfig?.isActive ? "Live" : "Inactive"}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate("/admin/ringtone-pop")}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card className="border-border bg-card">
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}