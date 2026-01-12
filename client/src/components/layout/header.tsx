import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import logoImage from "@assets/Logo_1758887059353.gif";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Menu, X, Wallet, Music, User as UserIcon, LogOut, ChevronRight } from "lucide-react";

// Helper function to safely parse balance
function getValidBalance(balance: string | null | undefined): number {
  if (!balance) return 0;
  
  // Remove any non-numeric characters except decimal point and minus sign
  const cleaned = balance.toString().replace(/[^\d.-]/g, '');
  
  // Parse as float
  const parsed = parseFloat(cleaned);
  
  // Check if it's a valid number
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  
  // Ensure it's not negative (unless you allow negative balances)
  return Math.max(0, parsed);
}

export default function Header() {
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user as User | null;
  const logout = auth.logout;
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: userData } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await apiRequest("/api/auth/user", "GET");
      return res.json();
    },
    enabled: !!isAuthenticated,
  });

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

  const ringtonePoints = userData?.ringtonePoints ?? user?.ringtonePoints ?? 0;
  const userBalance = getValidBalance(userData?.balance ?? user?.balance);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'glass-modern shadow-2xl shadow-black/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20 lg:h-24">
          
          <Link href="/">
            <div className="flex items-center cursor-pointer group">
              <img
                src={logoImage}
                alt="RingTone Riches"
                className="h-16 sm:h-14 lg:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                data-testid="img-logo"
              />
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-12">
            <Link href="/">
              <span className="relative text-sm font-semibold tracking-wide text-white/80 hover:text-white transition-colors cursor-pointer group" data-testid="link-competitions">
                OUR COMPETITIONS
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 group-hover:w-full" />
              </span>
            </Link>
            <Link href="/winners">
              <span className="relative text-sm font-semibold tracking-wide text-white/80 hover:text-white transition-colors cursor-pointer group" data-testid="link-winners">
                PAST WINNERS
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 group-hover:w-full" />
              </span>
            </Link>
            <span className="relative text-sm font-semibold tracking-wide text-white/80 hover:text-white transition-colors cursor-pointer group" data-testid="link-jackpots">
              JACKPOTS
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 group-hover:w-full" />
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/wallet?tab=ringtone">
                  <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-white/10 transition-all cursor-pointer group" data-testid="button-ringtone-points">
                    <Music className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                    <span className="text-xs md:text-sm font-semibold text-white">{ringtonePoints.toLocaleString()}</span>
                  </div>
                </Link>

                <Link href="/wallet?tab=wallet">
                  <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-white/10 transition-all cursor-pointer group" data-testid="button-wallet">
                    <Wallet className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                    <span className="text-xs md:text-sm font-semibold text-white">
                      £{userBalance.toFixed(2)}
                    </span>
                  </div>
                </Link>
                
                <Link href="/wallet?tab=account">
                  <div className="hidden lg:flex">
                    <button className="btn-modern-primary text-xs px-6 py-3" data-testid="button-account">
                      MY ACCOUNT
                    </button>
                  </div>
                </Link>
                
                <div className="hidden lg:flex">
                  <button
                    onClick={handleLogout}
                    className="hidden lg:flex btn-modern-secondary text-xs px-6 py-3"
                    data-testid="button-logout"
                  >
                    LOGOUT
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link href="/login">
                  <button className="btn-modern-secondary text-xs px-6 py-3" data-testid="button-login">
                    LOGIN
                  </button>
                </Link>
                <Link href="/register">
                  <button className="btn-modern-primary text-xs px-6 py-3" data-testid="button-register">
                    REGISTER
                  </button>
                </Link>
              </div>
            )}

            <button
              className="lg:hidden flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div 
            className="absolute inset-0 bg-black"
            onClick={() => setMobileOpen(false)}
          />
          
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="relative h-full flex flex-col pt-20 px-6 pb-8">
            <div className="space-y-2">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group" data-testid="mobile-link-competitions">
                  <span className="text-lg font-bold text-white">OUR COMPETITIONS</span>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/winners" onClick={() => setMobileOpen(false)}>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group" data-testid="mobile-link-winners">
                  <span className="text-lg font-bold text-white">PAST WINNERS</span>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="#" onClick={() => setMobileOpen(false)}>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group" data-testid="mobile-link-jackpots">
                  <span className="text-lg font-bold text-white">JACKPOTS</span>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            <div className="divider-gold my-6" />

            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Link href="/wallet?tab=ringtone" onClick={() => setMobileOpen(false)} className="flex-1">
                    <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10" data-testid="mobile-ringtone-points">
                      <Music className="w-5 h-5 text-amber-400" />
                      <span className="text-lg font-bold text-white">{ringtonePoints.toLocaleString()}</span>
                    </div>
                  </Link>
                  <Link href="/wallet?tab=wallet" onClick={() => setMobileOpen(false)} className="flex-1">
                    <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10" data-testid="mobile-wallet">
                      <Wallet className="w-5 h-5 text-amber-400" />
                      <span className="text-lg font-bold text-white">
                        £{userBalance.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                </div>

                <Link href="/wallet?tab=account" onClick={() => setMobileOpen(false)}>
                  <button className="w-full mt-5 btn-modern-primary py-4 text-base" data-testid="mobile-button-account">
                    <UserIcon className="w-5 h-5 mr-2" />
                    MY ACCOUNT
                  </button>
                </Link>
                
                <button
                  onClick={(e) => {
                    setMobileOpen(false);
                    handleLogout(e);
                  }}
                  className="w-full btn-modern-secondary py-4 text-base"
                  data-testid="mobile-button-logout"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  LOGOUT
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <button className="w-full btn-modern-secondary py-4 text-base" data-testid="mobile-button-login">
                    LOGIN
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <button className="w-full mt-3 btn-modern-primary py-4 text-base" data-testid="mobile-button-register">
                    REGISTER
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}