import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CompetitionCard from "@/components/competition-card";
import StatsBanner from "@/components/stats-banner";
import { Competition, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import FeaturedCompetitions from "./featuredCompetitions";
import { Sparkles, Trophy, Zap, Gift, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { isAuthenticated, user } = useAuth() as { isAuthenticated: boolean; user: User | null };
  const { toast } = useToast();

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  // Use useMemo to avoid infinite re-render loops
  const filteredCompetitions = useMemo(() => {
    if (activeFilter === "all") {
      if (!isAuthenticated) {
        return competitions.filter((c) => c.type !== "instant");
      } else {
        return competitions;
      }
    } else {
      return competitions.filter((c) => c.type === activeFilter);
    }
  }, [competitions, isAuthenticated, activeFilter]);

  const handleFilterChange = (filterType: string) => {
    setActiveFilter(filterType);
    // filteredCompetitions will automatically update via useMemo
  };

  const newsletterSubscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("/api/user/newsletter/subscribe", "POST", { email });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success! 🎉",
        description: data.message,
        variant: "default",
      });
      setNewsletterEmail("");
      // Invalidate auth user cache to refresh subscription status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Invalidate marketing subscribers list so admin panel updates
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
      // Invalidate auth user cache to refresh subscription status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Invalidate marketing subscribers list so admin panel updates
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

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    newsletterSubscribeMutation.mutate(newsletterEmail);
  };

  const handleNewsletterUnsubscribe = () => {
    newsletterUnsubscribeMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-0 py-0">
          {competitions.length > 0 ? (
            <FeaturedCompetitions competitions={competitions} />
          ) : (
            <div className="text-center text-slate-400 py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading amazing prizes...</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Banner */}
      <StatsBanner />

      {/* Filter Tabs */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-primary/30 sticky top-0 z-40 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {[
              { id: "all", label: "All", icon: Sparkles, color: "from-primary to-yellow-400" },
              { id: "spin", label: "Spin", icon: Zap, color: "from-purple-500 to-pink-500" },
              { id: "scratch", label: "Scratch Cards", icon: Trophy, color: "from-blue-500 to-cyan-500" },
              { id: "instant", label: "Competitions", icon: Gift, color: "from-green-500 to-emerald-500" }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`relative px-4 md:px-8 py-3 md:py-4 rounded-xl font-black text-sm md:text-base tracking-wide transition-all overflow-hidden group ${
                  activeFilter === filter.id
                    ? "shadow-2xl shadow-primary/50 scale-105"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:shadow-lg hover:shadow-primary/20"
                }`}
                data-testid={`button-filter-${filter.id}`}
              >
                {activeFilter === filter.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${filter.color} animate-pulse`}></div>
                )}
                {activeFilter === filter.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${filter.color} blur-xl opacity-75`}></div>
                )}
                <span className={`relative z-10 flex items-center gap-1.5 md:gap-2 ${
                  activeFilter === filter.id ? "text-slate-900 drop-shadow-lg" : ""
                }`}>
                  <filter.icon className="w-4 h-4 md:w-5 md:h-5" />
                  {filter.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Grid - 2 COLUMNS ON MOBILE! */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground font-semibold">Loading amazing prizes...</p>
            </div>
          ) : filteredCompetitions.length > 0 ? (
            <>
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-5xl font-black mb-2">
                  <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                    {activeFilter === "all" 
                      ? "🎯 All Live Competitions" 
                      : activeFilter === "spin"
                      ? "🎡 Spin to Win"
                      : activeFilter === "scratch"
                      ? "🎫 Scratch & Win"
                      : "🎟️ Competitions"}
                  </span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-lg font-semibold">
                  {filteredCompetitions.length} amazing prizes waiting for you!
                </p>
              </div>

              {/* FIXED GRID: 2 columns mobile, 3 tablet, 4 desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredCompetitions.map((competition) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    authenticated={true}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-xl">No competitions found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Subscription Section - Only show when logged in */}
      {isAuthenticated && (
        <section className="py-12 md:py-16 bg-gradient-to-r from-slate-900 via-primary/10 to-slate-900 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-yellow-400 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 border-2 border-primary/30 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                  <Mail className="w-8 h-8 text-slate-900" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black mb-3">
                  <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                    {user?.receiveNewsletter ? "Newsletter Subscribed!" : "Get Exclusive Offers!"}
                  </span>
                </h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  {user?.receiveNewsletter 
                    ? "You're now receiving our latest news, updates, and offers by email and SMS!"
                    : "Enter your email to receive our latest news, updates, and offers by email and SMS!"}
                </p>
              </div>

              {user?.receiveNewsletter ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-semibold">You're subscribed with {user.email}</span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleNewsletterUnsubscribe}
                    variant="outline"
                    className="w-full h-12 md:h-14 border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold text-base md:text-lg rounded-xl transition-all"
                    disabled={newsletterUnsubscribeMutation.isPending}
                    data-testid="button-newsletter-unsubscribe"
                  >
                    {newsletterUnsubscribeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                        Unsubscribing...
                      </div>
                    ) : (
                      "Unsubscribe from Newsletter"
                    )}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubscribe} className="space-y-4">
                  <div className="relative">
                    <Input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={user?.email || "Enter your email"}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 h-12 md:h-14 text-base md:text-lg pl-12 pr-4 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50"
                      data-testid="input-newsletter-email"
                      disabled={newsletterSubscribeMutation.isPending}
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 md:h-14 bg-gradient-to-r from-primary to-yellow-400 hover:from-yellow-400 hover:to-primary text-slate-900 font-black text-base md:text-lg rounded-xl shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/50 hover:scale-[1.02]"
                    disabled={newsletterSubscribeMutation.isPending}
                    data-testid="button-newsletter-subscribe"
                  >
                    {newsletterSubscribeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        Subscribing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Subscribe Now
                      </div>
                    )}
                  </Button>

                  <p className="text-xs text-slate-400 text-center mt-4">
                    📧 Use the email address you registered with
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}