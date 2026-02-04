import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Shield, TrendingUp, MessageCircle, Sparkles, Zap, Crown } from "lucide-react";

interface Review {
  name: string;
  rating: string;
  title: string;
  text: string;
  date: string;
}

interface ApiResponse {
  totalReviews: string;
  averageRating: string;
  reviews: Review[];
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState<string>('0');
  const [averageRating, setAverageRating] = useState<string>('N/A');
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | '5' | '4'>('all');
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    fetch("http://localhost:6500/api/trustpilot-reviews")
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        const fetchedReviews = data.reviews || [];
        setReviews(fetchedReviews);
        setFilteredReviews(fetchedReviews);
        setTotalReviews(data.totalReviews || '0');
        setAverageRating(data.averageRating || 'N/A');
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setReviews([]);
        setFilteredReviews([]);
        setTotalReviews('0');
        setAverageRating('N/A');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(r => r.rating === filter));
    }
    setCurrentIndex(0);
  }, [filter, reviews]);

  const nextReview = () => {
    setDirection(1);
    if (filteredReviews.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % filteredReviews.length);
    }
  };

  const prevReview = () => {
    setDirection(-1);
    if (filteredReviews.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + filteredReviews.length) % filteredReviews.length);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const RatingStars = ({ rating, size = "md" }: { rating: string; size?: "sm" | "md" | "lg" }) => {
    const numRating = parseInt(rating);
    const sizeClass = size === "lg" ? "w-6 h-6" : size === "md" ? "w-4 h-4" : "w-3 h-3";
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${
              i < numRating ? "fill-yellow-400 text-yellow-400" : "fill-gray-700 text-gray-700"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-48 md:h-64">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 relative overflow-hidden ">
      {/* Premium Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-yellow-500/5"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
        
        {/* Animated particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-1/4 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-20 left-1/3 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Gold Glow Border */}
      {/* <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -inset-4 md:-inset-6 lg:-inset-8 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-3xl blur-2xl opacity-10"></div>
      </div> */}

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Premium Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12 md:mb-20"
        >
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 mb-6 md:mb-8 group hover:border-yellow-400/50 transition-all duration-300">
            <Crown className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            <span className="text-xs md:text-sm font-semibold text-yellow-300 group-hover:text-yellow-200 transition-colors">
              Premium Reviews
            </span>
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 group-hover:animate-pulse" />
          </div>
          
          {/* Main Title with Premium Glow */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 px-2 relative">
            <span className="relative">
              {/* <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 blur-xl opacity-70"></span> */}
              <span className="relative bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                Customer Excellence
              </span>
            </span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-gray-300 text-base md:text-xl max-w-xl md:max-w-2xl mx-auto mb-8 md:mb-12 px-2 leading-relaxed">
            Join thousands of satisfied customers who trust our premium ringtones and exceptional service
          </p>

          {/* Premium Stats Grid */}
         {/* Premium Stats Grid - Updated for mobile */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 max-w-4xl mx-auto mb-12 md:mb-16 px-2">
  {/* Average Rating Card - Now appears on mobile */}
  <div className="col-span-2 md:col-span-1 relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 border border-yellow-500/20 group-hover:border-yellow-400/40 transition-all duration-300">
      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">{averageRating}</div>
      <div className="flex justify-center mb-2 md:mb-3 scale-75 md:scale-100">
        <RatingStars rating={Math.round(parseFloat(averageRating)).toString()} size="md" />
      </div>
      <div className="text-xs md:text-sm text-gray-400">Average Rating</div>
    </div>
  </div>

  {/* Total Reviews Card - Now appears on mobile */}
  <div className="col-span-1 relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 border border-yellow-500/20 group-hover:border-yellow-400/40 transition-all duration-300">
      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">{totalReviews}</div>
      <div className="flex items-center justify-center gap-1 md:gap-2 mb-2 md:mb-3">
        <Shield className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
        <span className="text-xs md:text-sm text-yellow-300">Verified</span>
      </div>
      <div className="text-xs md:text-sm text-gray-400">Total Reviews</div>
    </div>
  </div>

  {/* Satisfaction Card - Now appears on mobile */}
  <div className="col-span-1 relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 border border-yellow-500/20 group-hover:border-yellow-400/40 transition-all duration-300">
      <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">98%</div>
      <div className="flex items-center justify-center gap-1 md:gap-2 mb-2 md:mb-3">
        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
        <span className="text-xs md:text-sm text-yellow-300">Positive</span>
      </div>
      <div className="text-xs md:text-sm text-gray-400">Satisfaction Rate</div>
    </div>
  </div>
</div>
        </motion.div>

        {/* Premium Review Carousel */}
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-2">
          {filteredReviews.length > 0 ? (
            <div className="relative">
              {/* Premium Card with Gold Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-3xl blur-xl opacity-20"></div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-yellow-500/30 p-6 md:p-8 lg:p-10 shadow-2xl"
                >
                  {/* Review Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="flex items-start gap-4 md:gap-6">
                      {/* User Avatar with Glow */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full blur opacity-30"></div>
                        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-black font-bold text-xl md:text-2xl">
                          {filteredReviews[currentIndex]?.name?.charAt(0) || 'U'}
                        </div>
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">
                          {filteredReviews[currentIndex]?.name || 'Anonymous'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-gray-400 text-sm md:text-base">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {filteredReviews[currentIndex]?.rating || '5'} Star Rating
                          </span>
                          <span className="hidden md:inline w-1 h-1 bg-yellow-500/50 rounded-full"></span>
                          <span className="text-yellow-400 font-medium">
                            {formatDate(filteredReviews[currentIndex]?.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rating Badge */}
                    <div className="flex md:flex-col items-center md:items-end gap-3">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                        <RatingStars rating={filteredReviews[currentIndex]?.rating || '5'} size="md" />
                      </div>
                    </div>
                  </div>

                  {/* Review Title */}
                  <h4 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 md:mb-6 leading-snug md:leading-tight">
                    "{filteredReviews[currentIndex]?.title || 'Excellent Service!'}"
                  </h4>

                  {/* Review Text */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500/50 via-yellow-400/30 to-transparent"></div>
                    <p className="text-gray-300 text-base md:text-lg lg:text-xl leading-relaxed md:leading-relaxed pl-4 md:pl-6 italic">
                      {filteredReviews[currentIndex]?.text || 'No review text available.'}
                    </p>
                  </div>

                  {/* Navigation & Progress */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-0 pt-6 md:pt-8 mt-6 md:mt-8 border-t border-yellow-500/20">
                    {/* Progress Dots */}
                    <div className="flex gap-1.5 md:gap-2 order-2 sm:order-1">
                      {filteredReviews.slice(0, Math.min(6, filteredReviews.length)).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                          }}
                          className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${
                            idx === currentIndex
                              ? 'bg-yellow-500 w-4 md:w-6 ring-2 ring-yellow-500/30'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                          aria-label={`Go to review ${idx + 1}`}
                        />
                      ))}
                    </div>

                    {/* Review Counter */}
                    <div className="text-sm md:text-base text-gray-400 order-1 sm:order-2">
                      Review <span className="text-yellow-400 font-bold">{currentIndex + 1}</span> of{" "}
                      <span className="text-white font-bold">{filteredReviews.length}</span>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-3 md:gap-4 order-3">
                      <button
                        onClick={prevReview}
                        className="group p-2 md:p-2.5 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-yellow-500/20 hover:border-yellow-400/40 text-gray-300 hover:text-white transition-all duration-300 flex-shrink-0"
                        aria-label="Previous review"
                      >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={nextReview}
                        className="group p-2 md:p-2.5 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-yellow-500/20 hover:border-yellow-400/40 text-gray-300 hover:text-white transition-all duration-300 flex-shrink-0"
                        aria-label="Next review"
                      >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl md:rounded-3xl border border-yellow-500/20 p-8 md:p-12">
              <MessageCircle className="w-16 h-16 md:w-20 md:h-20 text-yellow-500/50 mx-auto mb-4 md:mb-6" />
              <h3 className="text-xl md:text-2xl font-semibold text-gray-300 mb-2">No reviews found</h3>
              <p className="text-gray-500 text-base md:text-lg max-w-md mx-auto">
                Try selecting a different filter or check back later for new reviews.
              </p>
            </div>
          )}
        </div>

        {/* Premium CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mt-12 md:mt-20 px-2"
        >
          {/* Trustpilot Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 mb-4 md:mb-6 group hover:border-yellow-400/50 transition-all duration-300">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            <span className="text-xs md:text-sm font-semibold text-yellow-300 group-hover:text-yellow-200 transition-colors">
              Powered by Trustpilot
            </span>
            <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400" />
          </div>

          {/* Premium CTA Button */}
          <a
  href="https://www.trustpilot.com/review/ringtoneriches.co.uk"
  target="_blank"
  rel="noopener noreferrer"
  className="group inline-flex ml-2 items-center gap-3 md:gap-4 px-6 py-4 md:px-8 md:py-5 rounded-full font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 active:scale-95 relative"
>
  {/* Button Glow Effect - Fixed positioning */}
  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity -z-10"></div>
  
  {/* Button Background - Fixed positioning */}
  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full -z-10"></div>
  
  {/* Hover Overlay - Fixed positioning */}
  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full -z-10"></div>
  
  {/* Shimmer Effect - Fixed positioning */}
  <div className="absolute inset-0 overflow-hidden rounded-full -z-10">
    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
  </div>
  
  {/* Button Content */}
  <span className="relative z-10 flex items-center gap-3 md:gap-4 text-black">
    <Zap className="w-5 h-5 md:w-6 md:h-6" />
    <span>Share Your Experience</span>
    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
  </span>
</a>

          {/* Subtle Text */}
          <p className="text-gray-400 text-sm md:text-base mt-4 md:mt-6 max-w-md mx-auto">
            Your feedback helps us maintain our premium quality and assists fellow customers
          </p>
        </motion.div>
      </div>

      {/* Bottom Decorative Elements */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 md:w-96 md:h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
    </section>
  );
}