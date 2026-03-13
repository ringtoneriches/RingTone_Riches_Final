import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          Find answers to common questions about our platform
        </p>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8">
              <p className="text-center text-gray-400">Loading FAQs...</p>
            </CardContent>
          </Card>
        ) : faqs.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8">
              <p className="text-center text-gray-400">
                No FAQs available yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {visibleFaqs.map((faq) => (
              <Card
                key={faq.id}
                className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full text-left p-4 md:p-6 focus:outline-none"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-white font-medium text-sm md:text-base flex-1">
                      {faq.question}
                    </h3>
                    {expandedId === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-yellow-400 flex-shrink-0 transition-transform" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-yellow-400 flex-shrink-0 transition-transform" />
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
                        <div className="border-t border-zinc-800 pt-4">
                          <p className="text-gray-100 text-sm md:text-base whitespace-pre-line">
                            {faq.answer}
                          </p>
                          <p className="text-xs text-gray-500 mt-4">
                            Last updated: {format(new Date(faq.updatedAt), "MMMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
            
            {/* Load More Button */}
            {visibleCount < faqs.length && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
                >
                  Load More ({visibleCount} of {faqs.length} shown)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}