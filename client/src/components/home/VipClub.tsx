import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Mail, Crown, Sparkles, Bell, CheckCircle2 } from "lucide-react";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PERKS = [
  { Icon: Sparkles, label: "New prizes first" },
  { Icon: Bell, label: "Exclusive offers" },
  { Icon: Crown, label: "VIP-only drops" },
] as const;

export default function VipClub() {
  const { isAuthenticated, user } = useAuth() as {
    isAuthenticated: boolean;
    user: User | null;
  };
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    if (user?.email) setNewsletterEmail(user.email);
  }, [user?.email]);

  const newsletterSubscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("/api/user/newsletter/subscribe", "POST", { email });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
        variant: "default",
      });
      setNewsletterEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to subscribe to newsletter",
        variant: "destructive",
      });
    },
  });

  const newsletterUnsubscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/user/newsletter/unsubscribe", "POST", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Unsubscribed",
        description: data.message,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unsubscribe Failed",
        description: error.message || "Failed to unsubscribe from newsletter",
        variant: "destructive",
      });
    },
  });

  const handleNewsletterSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    if (!isAuthenticated) {
      setLocation("/register");
      return;
    }
    newsletterSubscribeMutation.mutate(newsletterEmail);
  };

  const subscribed = Boolean(isAuthenticated && user?.receiveNewsletter);

  return (
    <section className="relative py-12 sm:py-20 rr-section-defer" data-testid="section-vip-club">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rr-vip-panel">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1">
              <Crown className="h-3.5 w-3.5 text-[#F1D47A]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F1D47A]">
                VIP list
              </span>
            </div>
            <h2 className="font-prize text-[2rem] sm:text-5xl text-white break-words">
              {subscribed ? "YOU'RE ON THE LIST" : "JOIN THE VIP LIST"}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm sm:text-base text-white/50">
              {subscribed
                ? "Exclusive offers and competition updates are coming to your inbox."
                : "Be first to new prizes, exclusive offers, and the drops we don't post everywhere."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {PERKS.map((perk) => (
                <span key={perk.label} className="rr-vip-perk">
                  <perk.Icon className="h-3.5 w-3.5 text-[#F1D47A]" />
                  {perk.label}
                </span>
              ))}
            </div>

            {subscribed ? (
              <div className="mx-auto mt-8 max-w-md space-y-3">
                <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-medium break-all">
                    Subscribed with {user?.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => newsletterUnsubscribeMutation.mutate()}
                  className="h-10 w-full text-xs font-bold uppercase tracking-widest text-white/30 transition-colors hover:text-[#FF263D]"
                  disabled={newsletterUnsubscribeMutation.isPending}
                  data-testid="button-newsletter-unsubscribe"
                >
                  {newsletterUnsubscribeMutation.isPending ? "Please wait…" : "Unsubscribe"}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubscribe}
                className="mx-auto mt-8 flex max-w-lg flex-col gap-2 sm:flex-row"
              >
                <label className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F1D47A]/70" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={user?.email || "your@email.com"}
                    className="rr-vip-input h-12 w-full rounded-xl pl-11 pr-4 text-sm text-white"
                    data-testid="input-newsletter-email"
                    disabled={newsletterSubscribeMutation.isPending}
                  />
                </label>
                <button
                  type="submit"
                  className="rr-cta h-12 w-full sm:w-auto shrink-0 rounded-xl px-7 text-sm font-black uppercase tracking-[0.12em] sm:tracking-[0.16em]"
                  disabled={newsletterSubscribeMutation.isPending}
                  data-testid="button-newsletter-subscribe"
                >
                  {newsletterSubscribeMutation.isPending
                    ? "Joining…"
                    : "Join VIP"}
                </button>
              </form>
            )}

            {!subscribed && (
              <p className="mt-3 text-[11px] text-white/30">
                {isAuthenticated
                  ? "Use the email on your account to get on the list."
                  : "Create an account to get the drops in your inbox."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
