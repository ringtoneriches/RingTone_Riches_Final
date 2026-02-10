import { Shield, CheckCircle, Award, Clock, Heart } from "lucide-react";

export default function ValentineStatsBanner() {
  const trustElements = [
    {
      icon: Shield,
      title: "100% Secure",
      description: "Love-level encryption",
      color: "text-red-400",
    },
    {
      icon: CheckCircle,
      title: "Fair & Transparent",
      description: "Every heart gets a chance",
      color: "text-red-400",
    },
    {
      icon: Award,
      title: "Guaranteed Winners",
      description: "Love prizes every draw",
      color: "text-red-400",
    },
    {
      icon: Clock,
      title: "Instant Results",
      description: "Feel love instantly",
      color: "text-red-400",
    },
  ];

  return (
    <section className="relative overflow-hidden py-10 backdrop-blur-xl bg-slate-900/90 border-b border-rose-500/20">

      {/* Floating Valentine glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 blur-3xl rounded-full animate-pulse delay-700" />
      </div>

      {/* Floating hearts */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Heart className="absolute top-10 left-1/4 w-10 h-10 text-pink-500 animate-pulse" />
        <Heart className="absolute bottom-10 right-1/4 w-12 h-12 text-red-500 animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">

          {trustElements.map((element, index) => (
            <div
              key={index}
              className="group hover:scale-110 transition-transform duration-300 bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-pink-500/20 hover:border-pink-500/50 shadow-xl"
            >
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className={`absolute inset-0 ${element.color} blur-2xl opacity-50 group-hover:opacity-100 transition-all`} />
                  <element.icon className={`relative w-10 h-10 md:w-12 md:h-12 ${element.color}`} />
                </div>
              </div>

              {/* Title */}
              <div className={`text-lg md:text-2xl font-extrabold ${element.color}`}>
                {element.title}
              </div>

              {/* Subtitle */}
              <div className="text-xs md:text-sm text-pink-200/70 font-medium mt-1">
                {element.description}
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
