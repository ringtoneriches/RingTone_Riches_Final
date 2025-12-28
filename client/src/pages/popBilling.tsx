import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UnifiedBilling from "@/components/unified-billing";
import { Sparkles, Gift, Star, PartyPopper } from "lucide-react";

const PopBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: popConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/admin/game-pop-config"],
  });

  useEffect(() => {
    if (popConfig && popConfig.isVisible === false) {
      toast({
        title: "Ringtone Pop Unavailable",
        description: "Ringtone Pop is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [popConfig?.isVisible]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_100%,rgba(168,85,247,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(250,204,21,0.08),transparent_50%)]" />
      
      <div className="absolute top-32 right-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 left-20 w-80 h-80 bg-yellow-500/4 rounded-full blur-3xl animate-pulse delay-500" />
      
      <div className="absolute top-1/4 right-1/4 animate-float">
        <Sparkles className="w-8 h-8 text-yellow-500/20" />
      </div>
      <div className="absolute top-1/2 left-1/4 animate-float-delayed">
        <Star className="w-6 h-6 text-purple-500/15" />
      </div>
      <div className="absolute bottom-1/4 right-1/3 animate-float">
        <Gift className="w-7 h-7 text-pink-500/12" />
      </div>
      <div className="absolute top-2/3 right-1/2 animate-float-delayed">
        <PartyPopper className="w-9 h-9 text-blue-500/10" />
      </div>

      <Header />
      
      <main className="flex-1 py-8 relative z-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-2 border-purple-500/30 mb-4 animate-bounce-slow">
              <PartyPopper className="w-10 h-10 text-yellow-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
              Ringtone Pop
            </h1>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get ready to pop some balloons and win amazing prizes! 
              <span className="text-yellow-500 font-semibold"> Match 3 to WIN BIG!</span>
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-purple-400/80">
              <Sparkles className="w-4 h-4" />
              <span>Pop 3 Balloons • Match to Win • Instant Prizes</span>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-600/20 to-yellow-500/20 rounded-2xl blur opacity-75 animate-glow" />
            <div className="relative">
              {orderId && <UnifiedBilling orderId={orderId} orderType="pop" />}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </div>
  );
};

export default PopBilling;