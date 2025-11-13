import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import Footer from "@/components/layout/footer";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

  export function UpdateProfileModal({ user }: { user: any }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    dateOfBirth: user?.dateOfBirth || "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/auth/user", "PUT", form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated" });
      setOpen(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Something went wrong",
      });
    },
  });

  return (
    <>
      <button
        className="w-full text-left text-muted-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(true)}
      >
        Update Profile
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>First Name</Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={form.dateOfBirth || ""}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ChangePasswordModal() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/auth/user", "PUT", { password });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated successfully" });
      setPassword("");
      setOpen(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Something went wrong",
      });
    },
  });

  return (
    <>
      <button
        className="w-full text-left text-muted-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(true)}
      >
        Change Password
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !password}
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


export default function Account() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth() as {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
  };

  console.log("User data:", user);
  const LogoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/auth/logout", "POST");
      return res.json();
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Something went wrong",
      });
    },
  });

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    LogoutMutation.mutate();
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);




  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Navigation Tabs - Mobile Optimized */}
        <div className="bg-muted text-center py-3 sm:py-4 mb-4 sm:mb-8 rounded-lg">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm px-2">
            <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-orders">
              Orders
            </Link>
            <Link href="/entries" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-entries">
              Entries
            </Link>
            <Link href="/ringtune-points" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-ringtune">
              RingTone Points
            </Link>
            <Link href="/referral" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-referral">
              Referral
            </Link>
            <Link href="/wallet" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-wallet">
              Wallet
            </Link>
            <span className="text-primary font-semibold px-2 py-1" data-testid="text-current-page">Account</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center"
            data-testid="heading-account"
          >
            MY ACCOUNT
          </h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Account Overview */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-muted-foreground text-sm">
                      Email
                    </label>
                    <p className="text-foreground" data-testid="text-email">
                      {user?.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm">
                      Name
                    </label>
                    <p className="text-foreground" data-testid="text-name">
                      {user?.firstName || user?.lastName
                        ? `${user?.firstName || ""} ${
                            user?.lastName || ""
                          }`.trim()
                        : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm">
                      Member Since
                    </label>
                    <p
                      className="text-foreground"
                      data-testid="text-member-since"
                    >
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/orders">
                    <button
                      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      data-testid="button-view-orders"
                    >
                      View Orders
                    </button>
                  </Link>
                  <Link href="/wallet">
                    <button
                      className="w-full bg-muted text-muted-foreground py-3 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                      data-testid="button-manage-wallet"
                    >
                      Manage Wallet
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-bold mb-4">Account Balance</h3>
                <div className="text-center">
                  <p
                    className="text-3xl font-bold text-primary"
                    data-testid="text-balance"
                  >
                    £{parseFloat(user?.balance || "0").toFixed(2)}
                  </p>
                  <Link href="/wallet">
                    <button
                      className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      data-testid="button-top-up"
                    >
                      TOP UP
                    </button>
                  </Link>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-xl font-bold mb-4">Account Options</h3>
                <div className="space-y-3">
                 <UpdateProfileModal user={user} />
                 <ChangePasswordModal />
                  <button className="w-full text-left text-muted-foreground hover:text-primary transition-colors">
                    Notification Settings
                  </button>
                  
                   <button
              onClick={handleLogout}
              className="block w-full text-left text-destructive hover:underline"
            >
              Log out
            </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
