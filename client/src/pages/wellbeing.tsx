import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, Lock, EyeOff, PiggyBank, Calendar, BarChart3, Wallet, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WellbeingData {
  dailySpendLimit?: string | null;
  spentToday?: string;
  remaining?: string | null;
}


interface User {
  id: number;
  dailySpendLimit: string | null;
  selfSuspended: boolean;
  selfSuspensionEndsAt: string | null;
  firstName: string;
  lastName: string;
  email: string;
  disabled: boolean;
}

export default function Wellbeing() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [dailyLimit, setDailyLimit] = useState("");
  const [suspensionDays, setSuspensionDays] = useState("7");
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [isSuspensionOpen, setIsSuspensionOpen] = useState(false);
  const [isProcessingLogout, setIsProcessingLogout] = useState(false);

  // Fetch wellbeing data
  const { data: wellbeingData, isLoading } = useQuery<WellbeingData>({
    queryKey: ["/api/wellbeing"],
    enabled: !!user,
  });

  // Fetch user data for suspension status
  const { data: userData, refetch: refetchUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

const hasDailyLimit = wellbeingData?.dailySpendLimit !== null &&
  wellbeingData?.dailySpendLimit !== undefined &&
  Number(wellbeingData.dailySpendLimit) > 0;

  // Set initial daily limit from fetched data
useEffect(() => {
  if (!wellbeingData) return;
  
  if (wellbeingData.dailySpendLimit === null || wellbeingData.dailySpendLimit === undefined) {
    setDailyLimit("");
  } else {
    setDailyLimit(wellbeingData.dailySpendLimit);
  }
}, [wellbeingData]);


  // Mutation for setting daily limit
  const setDailyLimitMutation = useMutation({
    mutationFn: async (limit: string) => {
      const res = await apiRequest("/api/wellbeing/daily-limit","POST", { limit });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to set limit");
      }
      return res.json();
    },
    onSuccess: (_, limit) => {
  queryClient.invalidateQueries({ queryKey: ["/api/wellbeing"] });
  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

  const parsedLimit = Number(limit);
  toast({
    title: "Success",
    description:
      parsedLimit === 0
        ? "Daily spending limit removed"
        : `Daily spending limit updated to £${parsedLimit.toFixed(2)}`,
  });
},

    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update daily limit",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating daily limit
  const updateDailyLimitMutation = useMutation({
    mutationFn: async (limit: string | null) => {
      const res = await apiRequest( "/api/wellbeing/daily-limit", "PUT",{ limit });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to update limit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: `Daily spending limit updated to £${Number(dailyLimit).toFixed(2)}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update daily limit",
        variant: "destructive",
      });
    },
  });

  // Mutation for account suspension
  const suspendAccountMutation = useMutation({
    mutationFn: async (days: number) => {
      const res = await apiRequest( "/api/wellbeing/suspend","POST", { days });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to suspend account");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsSuspensionOpen(false);
      
      // Show immediate logout toast
      toast({
        title: "Account Suspended",
        description: "Your account has been suspended. You will be logged out in 5 seconds.",
        variant: "default",
      });

      // Refresh user data to get updated suspended status
      refetchUser();

      // Log out after 5 seconds
      setTimeout(() => {
        logout();
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend account",
        variant: "destructive",
      });
    },
  });

  // Mutation for account closure
  const closeAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/wellbeing/close-account", "POST");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || "Failed to close account");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsConfirmCloseOpen(false);
      
      // Show immediate logout toast
      toast({
        title: "Account Closed",
        description: "Your account has been closed. You will be logged out in 5 seconds.",
        variant: "destructive",
      });

      // Log out after 5 seconds
      setTimeout(() => {
        logout();
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close account",
        variant: "destructive",
      });
    },
  });

  const handleSetDailyLimit = () => {
    const parsed = Number(dailyLimit);

     if (parsed === 0) {
    updateDailyLimitMutation.mutate("0");
    setDailyLimit("");
    return;
  }

    if (isNaN(parsed) || parsed < 0) {
      toast({
        title: "Invalid limit",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    if (hasDailyLimit) {
      updateDailyLimitMutation.mutate(dailyLimit);
    } else {
      setDailyLimitMutation.mutate(dailyLimit);
    }
  };

  const handleRemoveDailyLimit = () => {
    updateDailyLimitMutation.mutate(null as any);
    setDailyLimit("");
  };

  const handleSuspendAccount = () => {
    const days = parseInt(suspensionDays);
    if (isNaN(days) || days <= 0 || days > 365) {
      toast({
        title: "Invalid duration",
        description: "Please enter a number between 1 and 365 days",
        variant: "destructive",
      });
      return;
    }
    suspendAccountMutation.mutate(days);
  };

  const handleCloseAccount = () => {
    closeAccountMutation.mutate();
  };

const spentToday = parseFloat(wellbeingData?.spentToday || "0");
 const dailyLimitValue =
  wellbeingData?.dailySpendLimit !== null && wellbeingData?.dailySpendLimit !== undefined && Number(wellbeingData.dailySpendLimit) > 0
    ? parseFloat(wellbeingData.dailySpendLimit)
    : null;

const remaining =
  wellbeingData?.remaining !== null  && wellbeingData?.remaining !== undefined
    ? parseFloat(wellbeingData.remaining)
    : null;

const progressPercentage = dailyLimitValue && dailyLimitValue > 0
  ? (spentToday / dailyLimitValue) * 100
  : 0;

  const isCurrentlySuspended = userData?.selfSuspended && 
    userData.selfSuspensionEndsAt && 
    new Date(userData.selfSuspensionEndsAt) > new Date();

const showProgress = dailyLimitValue !== null && dailyLimitValue > 0;


  // If user is suspended or disabled, show a message and redirect
  if (isCurrentlySuspended || userData?.disabled) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="w-full px-3 sm:px-4 py-4 sm:py-8">
          <Card className="max-w-2xl mx-auto mt-10">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {userData?.disabled ? "Account Closed" : "Account Suspended"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center">
                {userData?.disabled ? (
                  <Lock className="h-16 w-16 text-red-500" />
                ) : (
                  <EyeOff className="h-16 w-16 text-amber-500" />
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-semibold">
                  {userData?.disabled 
                    ? "Your account has been permanently closed." 
                    : "Your account has been temporarily suspended."}
                </p>
                
                {isCurrentlySuspended && userData.selfSuspensionEndsAt && (
                  <p className="text-muted-foreground">
                    Suspension ends: {new Date(userData.selfSuspensionEndsAt).toLocaleDateString("en-GB", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
                
                <p className="text-sm text-muted-foreground">
                  {userData?.disabled
                    ? "All your data has been deleted. You cannot access this account anymore."
                    : "You cannot place orders or enter competitions during this period."}
                </p>
              </div>
              
              <div className="pt-4">
                <Button
                  onClick={logout}
                  className="w-full"
                  variant={userData?.disabled ? "destructive" : "default"}
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
  
      <div className="w-full px-3 sm:px-4 py-4 sm:py-8">
       

        {/* Suspension Alert */}
        {isCurrentlySuspended && userData?.selfSuspensionEndsAt && (
          <Card className="mb-6 bg-gradient-to-br from-amber-900/30 to-amber-950/20 border-amber-500/50 shadow-xl shadow-amber-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-300 mb-1">Account Suspended</h3>
                  <p className="text-amber-100/80 text-sm">
                    Your account is currently suspended until{" "}
                    <span className="font-semibold text-amber-300">
                      {new Date(userData.selfSuspensionEndsAt).toLocaleDateString("en-GB", {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>. 
                    You will not be able to place orders or enter competitions during this period.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Spending Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-500/30 hover:border-blue-500/50 transition-all shadow-xl shadow-blue-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-400">
                <Wallet className="h-5 w-5" />
                Spent Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                £{spentToday.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400 mt-2">Amount spent in last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-xl shadow-emerald-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
                <BarChart3 className="h-5 w-5" />
                Daily Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
             <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              {dailyLimitValue !== null ? `£${dailyLimitValue.toFixed(2)}` : "No limit"}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {dailyLimitValue !== null ? "Your maximum daily spend" : "No spending limit set"}
            </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 border-violet-500/30 hover:border-violet-500/50 transition-all shadow-xl shadow-violet-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-violet-400">
                <PiggyBank className="h-5 w-5" />
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                {showProgress && remaining !== null
    ? `£${remaining.toFixed(2)}`
    : "—"}
              </p>
              <p className="text-sm text-gray-400 mt-2">Available to spend today</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Spending Limit Card */}
        <Card className="w-full mx-auto p-4 sm:p-6 mb-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-blue-500/30 hover:border-blue-500/50 transition-all shadow-xl shadow-blue-500/10">
          <CardHeader className="border-b border-blue-500/20 pb-4 mb-6">
            <CardTitle className="flex items-center gap-2 text-2xl text-blue-400">
              <PiggyBank className="h-6 w-6" />
              Daily Spending Limit
            </CardTitle>
            <CardDescription className="text-gray-400">
              Set a maximum amount you can spend in a 24-hour period
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Progress Bar */}
            {showProgress  && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
  <span className="text-sm font-medium text-gray-300">Spending Progress</span>
  <span className={`text-sm font-bold ${
    progressPercentage >= 90 ? "text-red-400" :
    progressPercentage >= 80 ? "text-amber-400" :
    "text-emerald-400"
  }`}>
    {progressPercentage.toFixed(1)}%
  </span>
</div>
                <div className="relative">
                  <Progress 
                    value={progressPercentage} 
                    className={`h-3 bg-zinc-800 ${
                      progressPercentage >= 90 ? "[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-red-600" :
                      progressPercentage >= 80 ? "[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-600" :
                      "[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-600"
                    }`}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>£0.00</span>
                    <span>£{dailyLimitValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Set/Update Limit */}
            <div className="space-y-6">
              <div className="bg-black/40 rounded-lg p-4 border border-zinc-700">
                <Label htmlFor="dailyLimit" className="text-gray-300 font-medium mb-3 block">
                  Set Daily Spending Limit (£)
                </Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      id="dailyLimit"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 50.00"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Set 0 to remove the limit entirely. Enter amount in GBP.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleSetDailyLimit}
                      disabled={setDailyLimitMutation.isPending || updateDailyLimitMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/50 flex-1"
                    >
                      {setDailyLimitMutation.isPending || updateDailyLimitMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                          Updating...
                        </>
                      ) : hasDailyLimit 
                        ? "Update Limit" 
                        : "Set Limit"}
                    </Button>
                    
                    {/* {hasDailyLimit  && (
                      <Button
                        variant="outline"
                        onClick={handleRemoveDailyLimit}
                        disabled={setDailyLimitMutation.isPending}
                        className="border-zinc-700 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 flex-1"
                      >
                        Remove Limit
                      </Button>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Protection Tools */}
        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temporary Suspension Card */}
          <Card className="bg-gradient-to-br from-amber-900/20 via-zinc-900 to-zinc-900 border-amber-500/40 hover:border-amber-500/60 transition-all shadow-xl shadow-amber-500/20">
            <CardHeader className="border-b border-amber-500/30">
              <CardTitle className="flex items-center gap-2 text-2xl text-amber-400">
                <EyeOff className="h-6 w-6" />
                Temporary Suspension
              </CardTitle>
              <CardDescription className="text-gray-400">
                Take a break from our services for a set period
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              <div className="bg-black/40 rounded-lg p-4 border border-amber-500/20">
                <div className="mb-4">
                  <Label htmlFor="suspensionDays" className="text-amber-300 font-medium mb-3 block">
                    Suspension Duration
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="suspensionDays"
                      type="number"
                      min="1"
                      max="365"
                      value={suspensionDays}
                      onChange={(e) => setSuspensionDays(e.target.value)}
                      className="bg-zinc-900 border-amber-500/30 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500 flex-1"
                    />
                    <span className="text-gray-400 whitespace-nowrap">days</span>
                  </div>
                  <p className="text-xs text-amber-500/80 mt-2">
                    Minimum 1 day, maximum 365 days. Cannot be reversed early.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-300">
                      During suspension, you will not be able to:
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400 ml-1">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>Log in for the duration of suspension</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>Enter competitions or play games</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>Place new orders or make purchases</span>
                    </li>
                  </ul>
                </div>
              </div>

              <Dialog open={isSuspensionOpen} onOpenChange={setIsSuspensionOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-500/50"
                    disabled={isCurrentlySuspended}
                  >
                    {isCurrentlySuspended ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Account Already Suspended
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Suspend Account
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-amber-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-amber-400 text-2xl">Confirm Account Suspension</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Are you sure you want to suspend your account for {suspensionDays} days?
                      This action cannot be reversed or removed early.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-300">
                        <strong>Important:</strong> Once submitted, your account will be immediately
                        suspended and you will not be able to access any paid features until the
                        suspension period ends on {new Date(Date.now() + parseInt(suspensionDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsSuspensionOpen(false)}
                      className="border-zinc-700 text-gray-400 hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-400"
                      onClick={handleSuspendAccount}
                      disabled={suspendAccountMutation.isPending}
                    >
                      {suspendAccountMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent mr-2" />
                          Processing...
                        </>
                      ) : "Confirm Suspension"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Account Closure Card */}
          <Card className="bg-gradient-to-br from-red-900/20 via-zinc-900 to-zinc-900 border-red-500/40 hover:border-red-500/60 transition-all shadow-xl shadow-red-500/20">
            <CardHeader className="border-b border-red-500/30">
              <CardTitle className="flex items-center gap-2 text-2xl text-red-400">
                <Lock className="h-6 w-6" />
                Account Closure
              </CardTitle>
              <CardDescription className="text-gray-400">
                Permanently close your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              <div className="bg-black/40 rounded-lg p-4 border border-red-500/20">
                <div className="mb-4">
                  <div className="flex items-start gap-3 mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">
                      This action is permanent and cannot be undone. You will lose access to all your data and account history.
                    </p>
                  </div>
                  
                  <h4 className="font-semibold text-red-400 mb-3">What will be lost:</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>All personal data and account information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Competition entries and order history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Wallet balance and Ringtone Points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>Referral rewards and bonuses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>All account access immediately</span>
                    </li>
                  </ul>
                </div>
              </div>

              <Dialog open={isConfirmCloseOpen} onOpenChange={setIsConfirmCloseOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/50"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Close Account Permanently
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-red-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-red-400 text-2xl">Final Warning: Account Closure</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      You are about to permanently close your account. This action is irreversible.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300 font-semibold">
                          ⚠️ This action is permanent and cannot be undone. Please confirm that you want to proceed.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-lg p-4 border border-zinc-700">
                      <h4 className="font-semibold text-gray-300 mb-3">Consequences of account closure:</h4>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>Permanent deletion of all account data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>Loss of all competition entries</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>Forfeiture of any remaining balance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>Immediate logout and account termination</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsConfirmCloseOpen(false)}
                      className="border-zinc-700 text-gray-400 hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400"
                      onClick={handleCloseAccount}
                      disabled={closeAccountMutation.isPending}
                    >
                      {closeAccountMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                          Processing...
                        </>
                      ) : "Permanently Close Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <Card className="w-full mx-auto mt-6 p-4 sm:p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-900 border-yellow-500/30 shadow-xl shadow-yellow-500/10">
          <CardHeader className="border-b border-yellow-500/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl text-yellow-400">
              <Shield className="h-6 w-6" />
              Wellbeing & Responsible Gaming
            </CardTitle>
            <CardDescription className="text-gray-400">
              Tools to help you stay in control of your gaming experience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-blue-400">Daily Spending Limit</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="bg-blue-500/20 rounded-lg p-2">
                      <PiggyBank className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-300">Set Your Limits</p>
                      <p className="text-sm text-gray-400">
                        Define a maximum daily spend to help manage your budget
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-emerald-500/20 rounded-lg p-2">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-300">Real-time Monitoring</p>
                      <p className="text-sm text-gray-400">
                        Track your spending progress with visual indicators
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-violet-500/20 rounded-lg p-2">
                      <Wallet className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-300">Flexible Adjustments</p>
                      <p className="text-sm text-gray-400">
                        Update or remove limits at any time to suit your needs
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-amber-400">Account Controls</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="bg-amber-500/20 rounded-lg p-2">
                      <EyeOff className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-300">Temporary Breaks</p>
                      <p className="text-sm text-gray-400">
                        Take a break with temporary suspension while keeping your data
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-red-500/20 rounded-lg p-2">
                      <Lock className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-300">Permanent Closure</p>
                      <p className="text-sm text-gray-400">
                        Complete account deletion for those who need it
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-yellow-500/20 rounded-lg p-2">
                      <Shield className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-300">Security & Compliance</p>
                      <p className="text-sm text-gray-400">
                        All actions are securely logged and compliant with regulations
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-700">
              <p className="text-sm text-gray-400 text-center">
                These tools are part of our commitment to responsible gaming. 
                If you need additional support, please contact our customer support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}