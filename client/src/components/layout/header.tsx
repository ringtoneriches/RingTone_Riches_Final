import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import logoImage from "@assets/Logo_1758887059353.gif";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Header() {
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user as User | null;
  const logout = auth.logout;

  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);


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


   return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <nav className="flex items-center justify-between">
          {/* Logo - Mobile Optimized */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <img
                src={logoImage}
                alt="RingToneRiches Logo"
                className="w-28 h-14 sm:w-36 sm:h-18 md:w-48 md:h-24 object-contain"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/">
              <span className="nav-link text-foreground hover:text-primary font-medium cursor-pointer">
                OUR COMPETITIONS
              </span>
            </Link>
            <Link href="/winners">
              <span className="nav-link text-foreground hover:text-primary font-medium cursor-pointer">
                PAST WINNERS
              </span>
            </Link>
            <span className="nav-link text-foreground hover:text-primary font-medium">
              JACKPOTS
            </span>
          </div>

          {/* User Account & Actions - Mobile Optimized */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                {/* Ringtone Points Button - Mobile Optimized */}
                <Link href="/wallet?tab=ringtone">
                  <button className="bg-muted text-yellow-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 hover:bg-primary hover:text-primary-foreground transition-colors text-xs sm:text-sm">
                    <i className="fas fa-music text-sm sm:text-base"></i>
                    <span>{ringtonePoints.toLocaleString()}</span>
                  </button>
                </Link>
                
                {/* Wallet Button - Mobile Optimized */}
                <Link href="/wallet?tab=wallet">
                  <button className="bg-muted text-yellow-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 hover:bg-primary hover:text-primary-foreground transition-colors text-xs sm:text-sm">
                    <i className="fas fa-wallet text-sm sm:text-base"></i>
                    <span>£{parseFloat(user?.balance || "0").toFixed(2)}</span>
                  </button>
                </Link>
                
                <Link href="/wallet?tab=account">
                  <button className="bg-primary hidden md:block text-primary-foreground px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                    MY ACCOUNT
                  </button>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="hidden md:inline border border-muted-foreground text-muted-foreground px-3 py-2 rounded-lg font-medium hover:bg-muted-foreground hover:text-background transition-colors"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <button className="border border-primary text-primary px-3 py-2 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                    LOGIN
                  </button>
                </Link>
                <Link href="/register">
                  <button className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                    REGISTER
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </nav>


        {/* Mobile Menu Overlay with Backdrop Blur and Centered Modal */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 z-[9999] lg:hidden flex items-center justify-center p-4"
            style={{
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {/* Backdrop with blur effect */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
              style={{
                animation: 'fadeIn 0.3s ease-out'
              }}
            />
            
            {/* Centered Menu Modal */}
            <div 
              className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border-2 border-primary w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>

              {/* Navigation Links */}
              <div className="p-6 space-y-2">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <div className="block p-4 rounded-xl text-white hover:bg-primary/20 hover:text-primary font-bold text-lg transition-all duration-200 hover:translate-x-2">
                    🏆 OUR COMPETITIONS
                  </div>
                </Link>
                <Link href="/winners" onClick={() => setMobileOpen(false)}>
                  <div className="block p-4 rounded-xl text-white hover:bg-primary/20 hover:text-primary font-bold text-lg transition-all duration-200 hover:translate-x-2">
                    👑 PAST WINNERS
                  </div>
                </Link>
                <Link href="#" onClick={() => setMobileOpen(false)}>
                  <div className="block p-4 rounded-xl text-white hover:bg-primary/20 hover:text-primary font-bold text-lg transition-all duration-200 hover:translate-x-2">
                    💎 JACKPOTS
                  </div>
                </Link>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-6"></div>

              {/* Auth Buttons */}
              <div className="p-6 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/wallet?tab=account" onClick={() => setMobileOpen(false)}>
                      <button className="w-full bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] text-gray-900 px-6 py-4 rounded-xl font-black text-lg shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 hover:scale-105">
                        MY ACCOUNT
                      </button>
                    </Link>
                    
                    <button
                      onClick={(e) => {
                        setMobileOpen(false);
                        handleLogout(e);
                      }}
                      className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 hover:scale-105"
                    >
                      🚪 LOGOUT
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <button className="w-full border-2 border-primary text-primary px-6 py-4 rounded-xl font-bold text-lg hover:bg-primary hover:text-gray-900 transition-all duration-300 hover:scale-105">
                        LOGIN
                      </button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <button className="w-full bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#FACC15] text-gray-900 px-6 py-4 rounded-xl font-black text-lg shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 hover:scale-105">
                        REGISTER
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <style>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px) scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </header>
  );
}
