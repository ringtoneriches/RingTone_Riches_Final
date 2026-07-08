import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UnifiedBilling from "@/components/unified-billing";
import { Crown, Sparkles, Star } from "lucide-react";

const RoyalBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: royalConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/royal-config"],
    queryFn: async () => {
      const res = await fetch("/api/royal-config");
      return res.json();
    },
  });

  useEffect(() => {
    if (royalConfig && royalConfig.isVisible === false) {
      toast({ title: "Royal Reels Unavailable", description: "Royal Reels is currently not available.", variant: "destructive" });
      navigate("/");
    }
  }, [royalConfig?.isVisible]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0d0005 0%,#1a000a 50%,#0d0005 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 100%,rgba(212,175,55,0.08),transparent 50%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 20%,rgba(139,0,0,0.12),transparent 50%)" }} />
        <div className="absolute top-32 right-16 w-64 h-64 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(212,175,55,0.05)" }} />
        <div className="absolute bottom-20 left-16 w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(139,0,0,0.06)", animation: "pulse 4s ease-in-out infinite 1s" }} />
        {["top-1/4 right-1/4", "top-1/2 left-1/4", "bottom-1/3 right-1/3"].map((pos, i) => (
          <div key={i} className={`absolute ${pos}`} style={{ animation: `float ${6+i}s ease-in-out infinite ${i*0.5}s` }}>
            {i===0 ? <Crown className="w-8 h-8" style={{ color: "rgba(212,175,55,0.18)" }} /> :
             i===1 ? <Star className="w-6 h-6" style={{ color: "rgba(212,175,55,0.14)" }} /> :
             <Sparkles className="w-7 h-7" style={{ color: "rgba(212,175,55,0.12)" }} />}
          </div>
        ))}
      </div>

      <Header />
      <main className="flex-1 py-8 relative z-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4" style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.25),rgba(139,0,0,0.25))", border: "2px solid rgba(212,175,55,0.4)", animation: "bounce-slow 3s ease-in-out infinite" }}>
              <img src="/royal-reels/logo.png" alt="Royal Reels" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#D4AF37,#FFD700,#B8860B,#FFD700,#D4AF37)" }} data-testid="text-royal-billing-title">
              Royal Reels
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Match 3 royal symbols to win — plus a chance at a{" "}
              <span className="font-bold" style={{ color: "#D4AF37" }}>Royal Replay!</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "rgba(212,175,55,0.7)" }}>
              <Crown className="w-4 h-4" />
              <span>3×3 Grid • 15 Prize Tiers • Jackpot £5,000</span>
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl blur opacity-75" style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.2),rgba(139,0,0,0.2),rgba(212,175,55,0.2))", animation: "glow 3s ease-in-out infinite" }} />
            <div className="relative">{orderId && <UnifiedBilling orderId={orderId} orderType="royal" />}</div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes bounce-slow{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow{0%,100%{opacity:0.5}50%{opacity:1}}
      `}</style>
    </div>
  );
};
export default RoyalBilling;