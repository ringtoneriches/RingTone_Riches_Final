import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import logoImage from "@assets/Logo_1758887059353.gif";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, X, Wallet, Music, User as UserIcon, LogOut, ChevronRight, Bell } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

// Helper function to safely parse balance
function getValidBalance(balance: string | null | undefined): number {
  if (!balance) return 0;
  const cleaned = balance.toString().replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Optimize scroll handler with passive event listener
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mobileOpen]);

  const { data: userData } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await apiRequest("/api/auth/user", "GET");
      return res.json();
    },
    enabled: !!isAuthenticated,
    staleTime: 30000, // Cache for 30 seconds
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

  const handleLogout = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    LogoutMutation.mutate();
  }, [LogoutMutation]);

  const toggleMobileMenu = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const ringtonePoints = userData?.ringtonePoints ?? user?.ringtonePoints ?? 0;
  const userBalance = getValidBalance(userData?.balance ?? user?.balance);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
                  loading="eager"
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

            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/wallet?tab=points">
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 md:px-4 md:py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-white/10 transition-all cursor-pointer group" data-testid="button-ringtone-points">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                      <span className="text-xs sm:text-sm font-semibold text-white">{ringtonePoints.toLocaleString()}</span>
                    </div>
                  </Link>

                  <Link href="/wallet?tab=wallet">
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 md:px-4 md:py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-white/10 transition-all cursor-pointer group" data-testid="button-wallet">
                      <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        £{userBalance.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                  
                  <NotificationsDropdown />
                  
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
                      className="btn-modern-secondary text-xs px-6 py-3"
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
                  ref={menuButtonRef}
                  className="lg:hidden flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95"
                  onClick={toggleMobileMenu}
                  data-testid="button-mobile-menu"
                  aria-label="Menu"
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                {mobileOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu - Optimized for performance */}
      <div 
        className={`fixed inset-0 z-[9999] lg:hidden transition-all duration-150 ${
          mobileOpen ? 'visible' : 'invisible pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/95 backdrop-blur-md transition-opacity duration-150 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
        />
        
        {/* Menu Panel - Slide from right for faster feel */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-gradient-to-b from-gray-900 to-black shadow-2xl transition-transform duration-150 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col pt-20 px-6 pb-8 overflow-y-auto">
            {/* Menu Items */}
            <div className="space-y-2">
              <Link href="/" onClick={closeMobileMenu}>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group active:scale-98">
                  <span className="text-lg font-bold text-white">OUR COMPETITIONS</span>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/winners" onClick={closeMobileMenu}>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group active:scale-98">
                  <span className="text-lg font-bold text-white">PAST WINNERS</span>
                  <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group cursor-pointer active:scale-98">
                <span className="text-lg font-bold text-white">JACKPOTS</span>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="divider-gold my-6" />

            {isAuthenticated ? (
              <div className="space-y-3">
                <Link href="/notifications" onClick={closeMobileMenu}>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all group active:scale-98">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-amber-400" />
                      <span className="text-lg font-bold text-white">NOTIFICATIONS</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <div className="flex gap-3">
                  <Link href="/wallet?tab=points" onClick={closeMobileMenu} className="flex-1">
                    <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 active:scale-98 transition-transform">
                      <Music className="w-5 h-5 text-amber-400" />
                      <span className="text-lg font-bold text-white">{ringtonePoints.toLocaleString()}</span>
                    </div>
                  </Link>
                  <Link href="/wallet?tab=wallet" onClick={closeMobileMenu} className="flex-1">
                    <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 active:scale-98 transition-transform">
                      <Wallet className="w-5 h-5 text-amber-400" />
                      <span className="text-lg font-bold text-white">
                        £{userBalance.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                </div>

                <Link href="/wallet?tab=account" onClick={closeMobileMenu}>
                  <button className="w-full mt-5 btn-modern-primary py-4 text-base active:scale-98 transition-transform">
                    <UserIcon className="w-5 h-5 mr-2 inline" />
                    MY ACCOUNT
                  </button>
                </Link>
                
                <button
                  onClick={(e) => {
                    closeMobileMenu();
                    handleLogout(e);
                  }}
                  className="w-full btn-modern-secondary py-4 text-base active:scale-98 transition-transform"
                >
                  <LogOut className="w-5 h-5 mr-2 inline" />
                  LOGOUT
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/login" onClick={closeMobileMenu}>
                  <button className="w-full btn-modern-secondary py-4 text-base active:scale-98 transition-transform">
                    LOGIN
                  </button>
                </Link>
                <Link href="/register" onClick={closeMobileMenu}>
                  <button className="w-full mt-3 btn-modern-primary py-4 text-base active:scale-98 transition-transform">
                    REGISTER
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}