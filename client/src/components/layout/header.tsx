import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import BrandLogo from "@/components/layout/BrandLogo";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, X, Wallet, Music, User as UserIcon, LogOut, ChevronRight, Bell, ShoppingCart, Gamepad2 } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import AnnouncementTicker from "@/components/home/AnnouncementTicker";
import ThemeToggle from "@/components/layout/ThemeToggle";
import MyPlaysDock from "@/components/layout/MyPlaysDock";
import CartDock from "@/components/layout/CartDock";
import { useBasket } from "@/hooks/useBasket";

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
  const headerRef = useRef<HTMLElement>(null);
  const [location] = useLocation();

  // Optimize scroll handler with passive event listener
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled((prev) => {
            const next = window.scrollY > 20;
            return prev === next ? prev : next;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // iOS Safari: rubber-band / URL-bar at scrollY ≈ 0 shifts the visual
  // viewport. Keep the bar pinned to the visible area (desktop is unaffected).
  useEffect(() => {
    const header = headerRef.current;
    const vv = window.visualViewport;
    if (!header || !vv) return;
    if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

    const pin = () => {
      const y = vv.offsetTop;
      header.style.transform = y ? `translate3d(0, ${y}px, 0)` : "";
    };

    pin();
    vv.addEventListener("scroll", pin, { passive: true });
    vv.addEventListener("resize", pin);
    return () => {
      vv.removeEventListener("scroll", pin);
      vv.removeEventListener("resize", pin);
      header.style.transform = "";
    };
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
  const { count: basketCount } = useBasket();

  const chrome = (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 rr-header transition-shadow duration-300 ${
          scrolled ? "is-scrolled" : ""
        }`}
      >
        <AnnouncementTicker />
        <div className="rr-header-line" aria-hidden />
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <nav className="flex h-16 items-center justify-between lg:h-[4.5rem]">
            {/* Mobile: menu | centered logo | wallet */}
            <div className="grid h-16 w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center lg:hidden">
              <div className="justify-self-start">
                <button
                  ref={menuButtonRef}
                  className="rr-header-menu shrink-0"
                  onClick={toggleMobileMenu}
                  data-testid="button-mobile-menu"
                  aria-label="Menu"
                  style={{
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>

              <Link href="/" className="flex max-w-[46vw] items-center justify-center px-1">
                <BrandLogo
                  className="h-7 w-auto max-h-7 max-w-full object-contain sm:h-8 sm:max-h-8"
                  testId="img-logo"
                />
              </Link>

              <div className="rr-header-actions justify-self-end">
                <Link href={isAuthenticated ? "/wallet?tab=wallet" : "/login"} className="shrink-0">
                  <div className="rr-header-chip rr-header-chip--balance cursor-pointer" data-testid="button-wallet">
                    <Wallet className="h-3.5 w-3.5 shrink-0 text-[#F1D47A]" />
                    <span className="whitespace-nowrap tabular-nums">£{userBalance.toFixed(2)}</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Desktop */}
            <Link href="/" className="hidden lg:block">
              <div className="flex cursor-pointer items-center group">
                <BrandLogo className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-6 xl:gap-10">
              <Link href="/">
                <span className={`rr-nav-link cursor-pointer ${location === "/" ? "is-active" : ""}`} data-testid="link-competitions">
                  Competitions
                </span>
              </Link>
              <Link href="/winners">
                <span className={`rr-nav-link cursor-pointer ${location === "/winners" ? "is-active" : ""}`} data-testid="link-winners">
                  Winners
                </span>
              </Link>
              <Link href="/#how-it-works">
                <span
                  className="rr-nav-link cursor-pointer"
                  data-testid="link-how-it-works"
                  onClick={(e) => {
                    if (location === "/") {
                      e.preventDefault();
                      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  How It Works
                </span>
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <Link href="/wallet?tab=points">
                    <div className="rr-header-chip cursor-pointer" data-testid="button-ringtone-points">
                      <Music className="w-3.5 h-3.5 text-[#F1D47A]" />
                      <span>{ringtonePoints.toLocaleString()}</span>
                    </div>
                  </Link>

                  <Link href="/wallet?tab=wallet">
                    <div className="rr-header-chip cursor-pointer">
                      <Wallet className="w-3.5 h-3.5 text-[#F1D47A]" />
                      <span>£{userBalance.toFixed(2)}</span>
                    </div>
                  </Link>

                  <NotificationsDropdown />

                  <Link href="/wallet?tab=account">
                    <button className="rr-cta rr-header-cta" data-testid="button-account">
                      MY ACCOUNT
                    </button>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="rr-header-ghost"
                    data-testid="button-logout"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <button className="rr-header-ghost" data-testid="button-login">
                      LOGIN
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="rr-cta rr-header-cta" data-testid="button-register">
                      REGISTER
                    </button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <div className={`rr-theme-dock ${mobileOpen ? "invisible pointer-events-none" : ""}`}>
        <ThemeToggle />
      </div>
      <div className={`rr-dock-stack ${mobileOpen ? "invisible pointer-events-none" : ""}`}>
        <CartDock hidden={mobileOpen} />
        <MyPlaysDock hidden={mobileOpen} />
      </div>

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
          className={`absolute right-0 top-0 bottom-0 flex w-full max-w-sm flex-col rr-mobile-sheet shadow-2xl transition-transform duration-150 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F1D47A]">
              Menu
            </span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                className="rr-header-menu"
                onClick={closeMobileMenu}
                aria-label="Close menu"
                data-testid="button-mobile-menu-close"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-8 pt-5">
            <div className="space-y-2">
              <Link href="/" onClick={closeMobileMenu}>
                <div className="rr-mobile-item group active:scale-98">
                  <span className="text-sm font-black uppercase tracking-[0.16em] text-white">Competitions</span>
                  <ChevronRight className="w-5 h-5 text-[#F1D47A] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/my-plays" onClick={closeMobileMenu}>
                <div className="rr-mobile-item group active:scale-98">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="w-5 h-5 text-[#F1D47A]" />
                    <span className="text-sm font-black uppercase tracking-[0.16em] text-white">My Plays</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#F1D47A] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/basket" onClick={closeMobileMenu}>
                <div className="rr-mobile-item group active:scale-98">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-[#F1D47A]" />
                    <span className="text-sm font-black uppercase tracking-[0.16em] text-white">Cart</span>
                    {basketCount > 0 && <span className="rr-nav-count">{basketCount}</span>}
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#F1D47A] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/winners" onClick={closeMobileMenu}>
                <div className="rr-mobile-item group active:scale-98">
                  <span className="text-sm font-black uppercase tracking-[0.16em] text-white">Winners</span>
                  <ChevronRight className="w-5 h-5 text-[#F1D47A] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/#how-it-works" onClick={(e) => {
                closeMobileMenu();
                if (location === "/") {
                  e.preventDefault();
                  setTimeout(() => {
                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }
              }}>
                <div className="rr-mobile-item group active:scale-98">
                  <span className="text-sm font-black uppercase tracking-[0.16em] text-white">How It Works</span>
                  <ChevronRight className="w-5 h-5 text-[#F1D47A] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

            {isAuthenticated ? (
              <div className="space-y-3">
                <Link href="/notifications" onClick={closeMobileMenu}>
                  <div className="rr-mobile-item group active:scale-98">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-[#F1D47A]" />
                      <span className="text-sm font-black uppercase tracking-[0.16em] text-white">Notifications</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#F1D47A] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <div className="flex gap-3">
                  <Link href="/wallet?tab=points" onClick={closeMobileMenu} className="flex-1">
                    <div className="rr-header-chip h-14 w-full justify-center">
                      <Music className="w-5 h-5 text-[#F1D47A]" />
                      <span className="text-base">{ringtonePoints.toLocaleString()}</span>
                    </div>
                  </Link>
                  <Link href="/wallet?tab=wallet" onClick={closeMobileMenu} className="flex-1">
                    <div className="rr-header-chip h-14 w-full justify-center">
                      <Wallet className="w-5 h-5 text-[#F1D47A]" />
                      <span className="text-base">£{userBalance.toFixed(2)}</span>
                    </div>
                  </Link>
                </div>

                <Link href="/wallet?tab=account" onClick={closeMobileMenu}>
                  <button className="rr-cta mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-[0.16em] active:scale-98">
                    <UserIcon className="w-5 h-5" />
                    MY ACCOUNT
                  </button>
                </Link>
                
                <button
                  onClick={(e) => {
                    closeMobileMenu();
                    handleLogout(e);
                  }}
                  className="rr-header-ghost h-12 w-full gap-2 text-sm active:scale-98"
                >
                  <LogOut className="w-5 h-5" />
                  LOGOUT
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/login" onClick={closeMobileMenu}>
                  <button className="rr-header-ghost h-12 w-full text-sm active:scale-98">
                    LOGIN
                  </button>
                </Link>
                <Link href="/register" onClick={closeMobileMenu}>
                  <button className="rr-cta mt-3 flex h-12 w-full items-center justify-center rounded-xl text-sm font-black uppercase tracking-[0.16em] active:scale-98">
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

  return createPortal(chrome, document.body);
}