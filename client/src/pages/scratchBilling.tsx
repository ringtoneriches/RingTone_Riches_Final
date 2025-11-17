import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UnifiedBilling from "@/components/unified-billing";
import { Sparkles, Award, Star, Gift } from "lucide-react";

const ScratchBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if scratch cards are visible
  const { data: scratchConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/admin/game-scratch-config"],
  });

  // Redirect if scratch cards are hidden
  useEffect(() => {
    if (scratchConfig && scratchConfig.isVisible === false) {
      toast({
        title: "Scratch Cards Unavailable",
        description: "Scratch cards are currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [scratchConfig?.isVisible]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_100%,rgba(250,204,21,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(250,204,21,0.08),transparent_50%)]" />
      
      <div className="absolute top-32 right-20 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 left-20 w-80 h-80 bg-yellow-500/4 rounded-full blur-3xl animate-pulse delay-500" />
      
      <div className="absolute top-1/4 right-1/4 animate-sparkle">
        <Sparkles className="w-8 h-8 text-yellow-500/20" />
      </div>
      <div className="absolute top-1/2 left-1/4 animate-sparkle-delayed">
        <Star className="w-6 h-6 text-yellow-500/15" />
      </div>
      <div className="absolute bottom-1/4 right-1/3 animate-sparkle">
        <Gift className="w-7 h-7 text-yellow-500/12" />
      </div>
      <div className="absolute top-2/3 right-1/2 animate-sparkle-delayed">
        <Award className="w-9 h-9 text-yellow-500/10" />
      </div>

      <Header />
      
      <main className="flex-1 py-8 relative z-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/30 mb-4 animate-wiggle">
              <Award className="w-10 h-10 text-yellow-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              The LandMark Loot
            </h1>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get your scratch cards and reveal instant prizes! 
              <span className="text-yellow-500 font-semibold"> Your next big win is just a scratch away!</span>
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-500/80">
              <Sparkles className="w-4 h-4" />
              <span>Instant Results • Big Prizes • Easy to Play</span>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-yellow-600/20 to-yellow-500/20 rounded-2xl blur opacity-75 animate-glow" />
            <div className="relative">
              {orderId && <UnifiedBilling orderId={orderId} orderType="scratch" />}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      <style>{`
        @keyframes sparkle {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            opacity: 0.2;
          }
          50% { 
            transform: scale(1.2) rotate(180deg);
            opacity: 0.4;
          }
        }
        
        @keyframes sparkle-delayed {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            opacity: 0.15;
          }
          50% { 
            transform: scale(1.3) rotate(-180deg);
            opacity: 0.3;
          }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .animate-sparkle {
          animation: sparkle 4s ease-in-out infinite;
        }
        
        .animate-sparkle-delayed {
          animation: sparkle-delayed 5s ease-in-out infinite;
        }
        
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
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

export default ScratchBilling;