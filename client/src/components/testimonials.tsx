import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Shield, TrendingUp, MessageCircle, Sparkles, Zap, Crown, Egg, Rabbit, Candy, Gift, Flower, Music, PartyPopper, Gem } from "lucide-react";

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
    fetch("https://ringtoneriches.co.uk/api/trustpilot-reviews")
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
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#0a0a0f] to-[#1a0f2e] relative overflow-hidden">
        {/* Easter loading background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-pink-300/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-300/5 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-center h-48 md:h-64">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Egg className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0f2e 30%, #2d1b3d 60%, #1a0f2e 100%)' }}>
      {/* Premium Easter Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-pink-300/3 to-green-300/5"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent"></div>
        
        {/* Floating Easter eggs background */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`bg-egg-${i}`}
            className="absolute pointer-events-none animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          >
            <Egg className="w-12 h-16 opacity-[0.03]" style={{ color: ['#FFB7C5', '#98FB98', '#FFD700', '#DDA0DD'][i % 4] }} />
          </div>
        ))}
        
        {/* Animated Easter sparkles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full animate-sparkle-float pointer-events-none"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              background: i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#FFB7C5' : i % 4 === 2 ? '#98FB98' : '#DDA0DD',
              top: `${2 + (i * 5) % 90}%`,
              left: `${1 + (i * 4) % 95}%`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: `0 0 ${6 + i % 6}px rgba(255,215,0,0.4)`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Premium Easter Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12 md:mb-20"
        >
          {/* Easter Premium Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-pink-400/20 border border-yellow-500/30 mb-6 md:mb-8 group hover:border-yellow-400/50 transition-all duration-300">
            <Rabbit className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors animate-bounce-soft" />
            <span className="text-xs md:text-sm font-semibold text-yellow-300 group-hover:text-yellow-200 transition-colors">
              Easter 2026 • Egg-cellent Reviews
            </span>
            <Egg className="w-3 h-3 md:w-4 md:h-4 text-pink-400 group-hover:animate-pulse" />
          </div>
          
          {/* Main Title with Easter Glow */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 px-2 relative">
            <span className="relative bg-gradient-to-r from-yellow-400 via-pink-300 to-green-300 bg-clip-text text-transparent">
              What Our 🥚 Egg Hunters Say
            </span>
          </h2>
          
          {/* Easter Subtitle */}
          <p className="text-gray-300 text-base md:text-xl max-w-xl md:max-w-2xl mx-auto mb-8 md:mb-12 px-2 leading-relaxed">
            Join thousands of happy customers who found their golden eggs and premium ringtones this Easter season
          </p>

          {/* Premium Easter Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 max-w-4xl mx-auto mb-12 md:mb-16 px-2">
            {/* Average Rating Card - Easter Edition */}
            <div className="col-span-2 md:col-span-1 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-pink-400 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-gray-900/90 to-purple-900/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-yellow-500/20 group-hover:border-yellow-400/40 transition-all duration-300 backdrop-blur-sm">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">{averageRating}</div>
                <div className="flex justify-center mb-2 md:mb-3 scale-75 md:scale-100">
                  <RatingStars rating={Math.round(parseFloat(averageRating)).toString()} size="md" />
                </div>
                <div className="text-xs md:text-sm text-gray-400">Golden Egg Rating</div>
              </div>
            </div>

            {/* Total Reviews Card - Easter Edition */}
            <div className="col-span-1 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-green-400 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-gray-900/90 to-purple-900/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-yellow-500/20 group-hover:border-yellow-400/40 transition-all duration-300 backdrop-blur-sm">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">{totalReviews}</div>
                <div className="flex items-center justify-center gap-1 md:gap-2 mb-2 md:mb-3">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  <span className="text-xs md:text-sm text-yellow-300">Happy Hunters</span>
                </div>
                <div className="text-xs md:text-sm text-gray-400">Total Reviews</div>
              </div>
            </div>

            {/* Satisfaction Card - Easter Edition */}
            <div className="col-span-1 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-green-400 rounded-xl md:rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-gray-900/90 to-purple-900/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-yellow-500/20 group-hover:border-yellow-400/40 transition-all duration-300 backdrop-blur-sm">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2">99%</div>
                <div className="flex items-center justify-center gap-1 md:gap-2 mb-2 md:mb-3">
                  <PartyPopper className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
                  <span className="text-xs md:text-sm text-pink-300">Egg-cited</span>
                </div>
                <div className="text-xs md:text-sm text-gray-400">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Filter Buttons - Easter Style */}
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-8 md:mb-12 flex-wrap">
            {[
              { id: 'all', label: 'All Reviews', icon: Sparkles, color: '#FFD700' },
              { id: '5', label: '5 Stars', icon: Crown, color: '#FFB7C5' },
              { id: '4', label: '4 Stars', icon: Flower, color: '#98FB98' }
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id as any)}
                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                  filter === filterOption.id
                    ? 'text-black'
                    : 'text-white/60 hover:text-white/80'
                }`}
                style={
                  filter === filterOption.id
                    ? {
                        background: `linear-gradient(135deg, ${filterOption.color}, ${filterOption.color === '#FFD700' ? '#FFB347' : filterOption.color === '#FFB7C5' ? '#FFD700' : '#98FB98'})`,
                        boxShadow: `0 0 20px ${filterOption.color}60`,
                      }
                    : {
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }
                }
              >
                <filterOption.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {filterOption.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Premium Easter Review Carousel */}
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-2">
          {filteredReviews.length > 0 ? (
            <div className="relative">
              {/* Easter Egg Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-pink-400 to-green-400 rounded-3xl blur-xl opacity-20 animate-pulse-slow"></div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative bg-gradient-to-br from-gray-900/95 via-purple-900/30 to-black/95 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-yellow-500/30 p-6 md:p-8 lg:p-10 shadow-2xl"
                >
                  {/* Decorative Easter Eggs in Corners */}
                  <div className="absolute top-3 right-3 opacity-10">
                    <Egg className="w-8 h-10 text-yellow-400" />
                  </div>
                  <div className="absolute bottom-3 left-3 opacity-10 transform rotate-45">
                    <Rabbit className="w-6 h-6 text-pink-400" />
                  </div>

                  {/* Review Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="flex items-start gap-4 md:gap-6">
                      {/* User Avatar with Easter Glow */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-pink-400 rounded-full blur opacity-30 animate-pulse-slow"></div>
                        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-pink-400 flex items-center justify-center text-black font-bold text-xl md:text-2xl">
                          {filteredReviews[currentIndex]?.name?.charAt(0) || 'E'}
                        </div>
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">
                          {filteredReviews[currentIndex]?.name || 'Happy Egg Hunter'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-gray-400 text-sm md:text-base">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {filteredReviews[currentIndex]?.rating || '5'} Golden Eggs
                          </span>
                          <span className="hidden md:inline w-1 h-1 bg-yellow-500/50 rounded-full"></span>
                          <span className="text-yellow-400 font-medium flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            {formatDate(filteredReviews[currentIndex]?.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rating Badge - Easter Style */}
                    <div className="flex md:flex-col items-center md:items-end gap-3">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                        <RatingStars rating={filteredReviews[currentIndex]?.rating || '5'} size="md" />
                      </div>
                    </div>
                  </div>

                  {/* Review Title with Easter Emoji */}
                  <h4 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 md:mb-6 leading-snug md:leading-tight">
                    🥚 "{filteredReviews[currentIndex]?.title || 'Egg-cellent Service!'}"
                  </h4>

                  {/* Review Text */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500/50 via-pink-400/30 to-green-400/30"></div>
                    <p className="text-gray-300 text-base md:text-lg lg:text-xl leading-relaxed md:leading-relaxed pl-4 md:pl-6 italic">
                      "{filteredReviews[currentIndex]?.text || 'Found my golden egg! Amazing experience!'}"
                    </p>
                  </div>

                  {/* Navigation & Progress */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-0 pt-6 md:pt-8 mt-6 md:mt-8 border-t border-yellow-500/20">
                    {/* Progress Dots - Easter Egg Style */}
                    <div className="flex gap-1.5 md:gap-2 order-2 sm:order-1">
                      {filteredReviews.slice(0, Math.min(6, filteredReviews.length)).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                          }}
                          className={`transition-all ${
                            idx === currentIndex
                              ? 'w-3 h-3 md:w-4 md:h-4 rounded-full bg-yellow-500 ring-2 ring-yellow-500/30'
                              : 'w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-700 hover:bg-gray-600'
                          }`}
                          aria-label={`Go to review ${idx + 1}`}
                        />
                      ))}
                    </div>

                    {/* Review Counter */}
                    <div className="text-sm md:text-base text-gray-400 order-1 sm:order-2">
                      <Egg className="inline w-3 h-3 mr-1 text-yellow-400" />
                      Review <span className="text-yellow-400 font-bold">{currentIndex + 1}</span> of{" "}
                      <span className="text-white font-bold">{filteredReviews.length}</span>
                      <Rabbit className="inline w-3 h-3 ml-1 text-pink-400" />
                    </div>

                    {/* Navigation Buttons - Easter Style */}
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
              <Egg className="w-16 h-16 md:w-20 md:h-20 text-yellow-500/50 mx-auto mb-4 md:mb-6" />
              <h3 className="text-xl md:text-2xl font-semibold text-gray-300 mb-2">No Easter reviews yet</h3>
              <p className="text-gray-500 text-base md:text-lg max-w-md mx-auto">
                Be the first to share your egg-citing experience!
              </p>
            </div>
          )}
        </div>

        {/* Premium Easter CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center flex items-center flex-col gap-5 mt-12 md:mt-20 px-2"
        >
          {/* Trustpilot Badge - Easter Style */}
          <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-gradient-to-r from-yellow-500/10 to-pink-400/10 border border-yellow-500/30 mb-4 md:mb-6 group hover:border-yellow-400/50 transition-all duration-300">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            <span className="text-xs md:text-sm font-semibold text-yellow-300 group-hover:text-yellow-200 transition-colors">
              Powered by Trustpilot
            </span>
            <Gem className="w-3 h-3 md:w-4 md:h-4 text-pink-400" />
          </div>

          {/* Easter Premium CTA Button */}
          <a
            href="https://www.trustpilot.com/review/ringtoneriches.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 md:gap-4 px-6 py-4 md:px-8 md:py-5 rounded-full font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 active:scale-95 relative"
          >
            {/* Button Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-pink-400 to-green-400 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity -z-10"></div>
            
            {/* Button Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-pink-400 rounded-full -z-10"></div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-green-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full -z-10"></div>
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 overflow-hidden rounded-full -z-10">
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
            </div>
            
            {/* Button Content */}
            <span className="relative z-10 flex items-center gap-3 md:gap-4 text-black">
              <Egg className="w-5 h-5 md:w-6 md:h-6 animate-bounce-soft" />
              <span>Share Your Egg-citing Experience</span>
              <PartyPopper className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>

          {/* Easter Subtle Text */}
          <p className="text-gray-400 text-sm md:text-base mt-4 md:mt-6 max-w-md mx-auto">
            Your golden egg feedback helps us create more egg-straordinary experiences for everyone 🐰🥚
          </p>
        </motion.div>
      </div>

      {/* Bottom Easter Decorative Elements */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 md:w-96 md:h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 bg-pink-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-1/3 w-32 h-32 bg-green-300/5 rounded-full blur-2xl"></div>

      {/* Custom Easter Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes sparkle-float {
          0%, 100% { opacity: 0; transform: scale(0.2) translateY(0); }
          10% { opacity: 1; transform: scale(1.2) translateY(-3px); }
          50% { opacity: 0.8; transform: scale(0.9) translateY(-10px); }
          90% { opacity: 0.3; transform: scale(0.5) translateY(-18px); }
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
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
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(100%) skewX(-20deg); }
        }
        .group-hover\:animate-shimmer:hover {
          animation: shimmer 1s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}