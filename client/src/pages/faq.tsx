import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Egg, Rabbit, Gift, PartyPopper, Sparkles, Candy, Flower, Gem } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Faq {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export default function FAQ() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  // Fetch FAQs
  const { data: faqs = [], isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, faqs.length));
  };

  const visibleFaqs = faqs.slice(0, visibleCount);

  return (
    <div className="relative overflow-hidden py-8 md:py-12" style={{
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0f2e 30%, #2d1b3d 60%, #1a0f2e 100%)'
    }}>
      {/* Easter Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Easter eggs */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`bg-egg-${i}`}
            className="absolute animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${12 + Math.random() * 8}s`,
            }}
          >
            <Egg className="w-12 h-16 opacity-[0.03]" style={{ color: ['#FFB7C5', '#98FB98', '#FFD700', '#DDA0DD'][i % 4] }} />
          </div>
        ))}
        
        {/* Easter sparkles */}
        {[...Array(25)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full animate-sparkle-float"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              background: i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#FFB7C5' : i % 4 === 2 ? '#98FB98' : '#DDA0DD',
              top: `${5 + (i * 6) % 90}%`,
              left: `${2 + (i * 5) % 95}%`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: `0 0 ${6 + i % 6}px rgba(255,215,0,0.4)`,
            }}
          />
        ))}
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-400/5 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-300/3 rounded-full blur-3xl animate-pulse-slow delay-500" />
      </div>

      {/* Top and bottom decorative lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* Easter Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm mb-4">
            <Rabbit className="w-4 h-4 text-yellow-400 animate-bounce-soft" />
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Easter 2026 • Egg-cellent Answers
            </span>
            <Egg className="w-3 h-3 text-pink-400" />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-pink-300 to-green-300 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base flex items-center justify-center gap-2">
            <Candy className="w-4 h-4 text-pink-400" />
            Find answers to common questions about our golden egg hunts
            <Flower className="w-4 h-4 text-green-400" />
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="bg-gradient-to-br from-gray-900/50 to-purple-900/20 border-yellow-500/20 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                    <Egg className="absolute inset-0 w-4 h-4 m-auto text-yellow-400 animate-pulse" />
                  </div>
                  <p className="text-center text-gray-400">Loading egg-cellent answers...</p>
                </div>
              </CardContent>
            </Card>
          ) : faqs.length === 0 ? (
            <Card className="bg-gradient-to-br from-gray-900/50 to-purple-900/20 border-yellow-500/20 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center">
                  <Egg className="w-12 h-12 text-yellow-500/30 mx-auto mb-3" />
                  <p className="text-gray-400">No FAQs available yet. Check back soon for golden answers!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {visibleFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <Card
                    className="bg-gradient-to-br from-gray-900/50 to-purple-900/20 border-yellow-500/20 overflow-hidden hover:border-yellow-400/40 transition-all duration-300 backdrop-blur-sm group"
                  >
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full text-left p-4 md:p-6 focus:outline-none"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Easter egg icon indicator */}
                          <div className="relative flex-shrink-0 mt-0.5">
                            <div className={`absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${expandedId === faq.id ? 'opacity-60' : ''}`} />
                            <div className={`relative w-6 h-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border flex items-center justify-center transition-all duration-300 ${expandedId === faq.id ? 'border-yellow-400 scale-110' : 'border-yellow-500/30 group-hover:border-yellow-400/60'}`}>
                              {expandedId === faq.id ? (
                                <PartyPopper className="w-3 h-3 text-yellow-400" />
                              ) : (
                                <Egg className="w-3 h-3 text-yellow-500/70 group-hover:text-yellow-400 transition-colors" />
                              )}
                            </div>
                          </div>
                          
                          <h3 className={`text-white font-medium text-sm md:text-base flex-1 transition-all duration-300 ${expandedId === faq.id ? 'text-yellow-300' : 'group-hover:text-yellow-200'}`}>
                            {faq.question}
                          </h3>
                        </div>
                        {expandedId === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-yellow-400 flex-shrink-0 transition-transform" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-yellow-400 flex-shrink-0 transition-transform group-hover:translate-y-0.5" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedId === faq.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 md:px-6 pb-4 md:pb-6">
                            <div className="border-t border-yellow-500/20 pt-4">
                              {/* Decorative egg icon before answer */}
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <Rabbit className="w-4 h-4 text-pink-400/60" />
                                </div>
                                <p className="text-gray-200 text-sm md:text-base whitespace-pre-line leading-relaxed">
                                  {faq.answer}
                                </p>
                              </div>
                              
                              {/* Footer with date and Easter touch */}
                              <div className="flex items-center justify-between mt-4 pt-2 border-t border-yellow-500/10">
                                <div className="flex items-center gap-2">
                                  <Gem className="w-3 h-3 text-yellow-500/40" />
                                  <p className="text-xs text-gray-500">
                                    Last updated: {format(new Date(faq.updatedAt), "MMMM dd, yyyy")}
                                  </p>
                                  <Sparkles className="w-3 h-3 text-pink-400/40" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/40" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400/40" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400/40" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
              
              {/* Load More Button - Easter Style */}
              {visibleCount < faqs.length && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mt-8"
                >
                  <Button
                    onClick={loadMore}
                    className="relative group overflow-hidden px-6 py-3 bg-gradient-to-r from-yellow-500 to-pink-500 text-black font-bold rounded-full transition-all duration-300 hover:scale-105"
                  >
                    {/* Button glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                      <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
                    </div>
                    
                    <span className="relative z-10 flex items-center gap-2">
                      <Egg className="w-4 h-4" />
                      Load More Golden Answers ({visibleCount} of {faqs.length})
                      <PartyPopper className="w-4 h-4" />
                    </span>
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Easter Footer Message */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/5 border border-yellow-500/15 backdrop-blur-sm">
            <Rabbit className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] md:text-xs text-gray-400">
              Still have questions? 🥚 Our egg-sperts are here to help! 🐰
            </span>
            <Candy className="w-3 h-3 text-pink-400" />
          </div>
        </div>
      </div>

      {/* Custom Easter Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(5deg); }
        }
        @keyframes sparkle-float {
          0%, 100% { opacity: 0; transform: scale(0.2) translateY(0); }
          10% { opacity: 1; transform: scale(1.2) translateY(-3px); }
          50% { opacity: 0.8; transform: scale(0.9) translateY(-12px); }
          90% { opacity: 0.3; transform: scale(0.5) translateY(-20px); }
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(100%) skewX(-20deg); }
        }
        
        .animate-float-slow {
          animation: float-slow ease-in-out infinite;
        }
        .animate-sparkle-float {
          animation: sparkle-float 3s ease-in-out infinite;
        }
        .animate-bounce-soft {
          animation: bounce-soft 2s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        .group-hover\:animate-shimmer:hover {
          animation: shimmer 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}