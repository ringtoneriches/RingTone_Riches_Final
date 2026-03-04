import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UnifiedBilling from "@/components/unified-billing";
import { Zap, Sparkles, Star } from "lucide-react";

const VoltzBilling = () => {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: voltzConfig } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/voltz-config"],
  });

  useEffect(() => {
    if (voltzConfig && voltzConfig.isVisible === false) {
      toast({
        title: "Ringtone Voltz Unavailable",
        description: "Ringtone Voltz is currently not available.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [voltzConfig?.isVisible]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_100%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(250,204,21,0.08),transparent_50%)]" />
      
      <div className="absolute top-32 right-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 left-20 w-80 h-80 bg-yellow-500/4 rounded-full blur-3xl animate-pulse delay-500" />
      
      <div className="absolute top-1/4 right-1/4 animate-float">
        <Zap className="w-8 h-8 text-yellow-500/20" />
      </div>
      <div className="absolute top-1/2 left-1/4 animate-float-delayed">
        <Star className="w-6 h-6 text-blue-500/15" />
      </div>
      <div className="absolute bottom-1/4 right-1/3 animate-float">
        <Sparkles className="w-7 h-7 text-cyan-500/12" />
      </div>

      <Header />
      
      <main className="flex-1 py-8 relative z-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-2 border-blue-500/30 mb-4 animate-bounce-slow">
              <Zap className="w-10 h-10 text-yellow-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-yellow-500 bg-clip-text text-transparent"
              data-testid="text-voltz-billing-title">
              Ringtone Voltz
            </h1>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Power up the switches and test your luck!
              <span className="text-yellow-500 font-semibold"> Press a switch to surge the power!</span>
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-blue-400/80">
              <Zap className="w-4 h-4" />
              <span>3 Switches • Electricity Surge • Instant Prizes</span>
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-600/20 to-yellow-500/20 rounded-2xl blur opacity-75 animate-glow" />
            <div className="relative">
              {orderId && <UnifiedBilling orderId={orderId} orderType="voltz" />}
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
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>
    </div>
  );
};

export default VoltzBilling;