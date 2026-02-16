import { Shield, Zap, Lock, CheckCircle, Award, Clock } from "lucide-react";

export default function StatsBanner() {
  const trustElements = [
    {
      icon: Shield,
      title: "100% Secure",
      description: "Bank-level encryption",
      color: "text-green-400"
    },
    {
      icon: CheckCircle,
      title: "Fair & Transparent",
      description: "Every entry has a chance",
      color: "text-primary"
    },
    {
      icon: Award,
      title: "Guaranteed Winners",
      description: "Prizes awarded every draw",
      color: "text-primary"
    },
    {
      icon: Clock,
      title: "Instant Results",
      description: "Know immediately if you win",
      color: "text-green-400"
    }
  ];

  return (
    <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-y-2 border-primary/20 py-6 md:py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {trustElements.map((element, index) => (
            <div 
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="flex justify-center mb-2 md:mb-3">
                <div className="relative">
                  <div className={`absolute inset-0 ${element.color} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                  <element.icon className={`relative w-8 h-8 md:w-12 md:h-12 ${element.color}`} />
                </div>
              </div>
              <div className={`text-base md:text-2xl font-black ${element.color} mb-1`}>
                {element.title}
              </div>
              <div className="text-[10px] md:text-sm text-slate-400 font-medium">
                {element.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
