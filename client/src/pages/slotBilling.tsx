import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UnifiedBilling from "@/components/unified-billing";
import { Coins, Sparkles, Star } from "lucide-react";

const SlotBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: slotConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/slot-config"],
  });

  useEffect(() => {
    if (slotConfig && slotConfig.isVisible === false) {
      toast({
        title: "Slot Machine Unavailable",
        description: "The Slot Machine is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [slotConfig?.isVisible]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#0a0800" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 100%, rgba(255,195,0,0.08), transparent 50%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 30%, rgba(255,140,0,0.05), transparent 50%)" }} />

      <div className="absolute top-32 right-20 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(255,195,0,0.04)" }} />
      <div className="absolute bottom-32 left-20 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(255,140,0,0.03)", animationDelay: "500ms" }} />

      <div className="absolute top-1/4 right-1/4 animate-bounce">
        <Coins className="w-8 h-8" style={{ color: "rgba(255,195,0,0.18)" }} />
      </div>
      <div className="absolute top-1/2 left-1/4" style={{ animation: "float 8s ease-in-out infinite" }}>
        <Star className="w-6 h-6" style={{ color: "rgba(255,185,0,0.14)" }} />
      </div>
      <div className="absolute bottom-1/4 right-1/3" style={{ animation: "float 6s ease-in-out infinite" }}>
        <Sparkles className="w-7 h-7" style={{ color: "rgba(255,140,0,0.12)" }} />
      </div>

      <Header />

      <main className="flex-1 py-8 relative z-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-8 space-y-4">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(255,195,0,0.2), rgba(255,140,0,0.2))",
                border: "2px solid rgba(255,185,0,0.3)",
                animation: "bounce-slow 3s ease-in-out infinite",
              }}
            >
              <Coins className="w-10 h-10" style={{ color: "#FFC300" }} />
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #FFC300, #FF8C00, #FFC300)" }}
              data-testid="text-slot-billing-title"
            >
              Slot Machine
            </h1>

            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Spin the reels and match the symbols!
              <span className="font-semibold" style={{ color: "#FFC300" }}> Yellow & Gold theme — big wins await!</span>
            </p>

            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "rgba(255,195,0,0.7)" }}>
              <Coins className="w-4 h-4" />
              <span>3×3 Reels • 20 Paylines • Wild Symbols</span>
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-1 rounded-2xl blur opacity-75"
              style={{
                background: "linear-gradient(135deg, rgba(255,195,0,0.18), rgba(255,140,0,0.18), rgba(255,195,0,0.18))",
                animation: "glow 2s ease-in-out infinite",
              }}
            />
            <div className="relative">
              {orderId && <UnifiedBilling orderId={orderId} orderType="slot" />}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes bounce-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
    </div>
  );
};

export default SlotBilling;