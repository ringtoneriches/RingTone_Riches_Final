import { useParams } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UnifiedBilling from "@/components/unified-billing";
import { Sparkles, Target, Zap } from "lucide-react";
import { Competition } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

const SpinBilling = () => {
  const { orderId , id } = useParams();

   const { data: competition, isLoading } = useQuery<Competition>({
    queryKey: ["/api/competitions", id],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${id}`);
      if (!res.ok) throw new Error("Failed to load competition");
      return res.json();
    },
    enabled: !!id,
  });

  console.log(competition)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(250,204,21,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(250,204,21,0.08),transparent_50%)]" />
      
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/3 rounded-full blur-3xl animate-pulse delay-700" />
      
      <div className="absolute top-1/4 left-1/4 animate-float">
        <Sparkles className="w-8 h-8 text-yellow-500/20" />
      </div>
      <div className="absolute top-1/3 right-1/3 animate-float-delayed">
        <Target className="w-6 h-6 text-yellow-500/15" />
      </div>
      <div className="absolute bottom-1/3 left-1/2 animate-float">
        <Zap className="w-10 h-10 text-yellow-500/10" />
      </div>

      <Header />
      
      <main className="flex-1 py-8 relative z-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/30 mb-4 animate-bounce-slow">
              <Target className="w-10 h-10 text-yellow-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              {/* {competition?.title} */} The Luxury Car Spin
            </h1>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Complete your purchase and get ready to spin for amazing prizes! 
              <span className="text-yellow-500 font-semibold"> Every spin is a chance to win big!</span>
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-2xl blur opacity-75" />
            <div className="relative">
              {orderId && <UnifiedBilling orderId={orderId} orderType="spin" />}
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
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
};

export default SpinBilling;
