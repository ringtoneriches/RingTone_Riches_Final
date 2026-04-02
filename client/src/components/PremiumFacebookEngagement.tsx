import { useEffect, useState } from 'react';
import { Facebook, Users, Zap, CheckCircle, Egg, Rabbit, Candy, Gift, PartyPopper, Flower, Music } from 'lucide-react';
import { CardContent } from './ui/card';

const formatMemberDisplay = (countStr: any) => {
    if (!countStr) return '6K';

    const match = countStr.match(/^(\d+)\.?\d*([KkMm]?)$/);

    if (match) {
      const number = match[1];
      const suffix = match[2] ? match[2].toUpperCase() : '';
      return `${number}${suffix}`;
    }

    return countStr.includes('.') ? countStr.split('.')[0] + 'K' : countStr;
};

const CompactFacebookCTA = () => {
    const [memberCount, setMemberCount] = useState('6.6K');
    const [loading, setLoading] = useState(false);
    const displayCount = formatMemberDisplay(memberCount);
    
    const fetchMemberCount = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/facebook-members');
        const data = await response.json();

        if (data.totalMembers > 0) {
          const formatted = data.totalMembers >= 1000 
            ? `${(data.totalMembers / 1000).toFixed(1)}K`
            : data.totalMembers.toString();
          setMemberCount(formatted);
        }
      } catch (error) {
        console.error('Failed to fetch member count:', error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchMemberCount();
    }, []);

    const handleJoin = () => {
      setTimeout(() => {
        window.open('https://www.facebook.com/groups/1358608295902979/', '_blank');
      }, 800);
    };

    return (
      <CardContent className="flex justify-center items-center p-6 py-10 bg-gradient-to-br from-[#0a0a0f] via-[#1a0f2e] to-[#0a0a0f] relative overflow-hidden">
        
        {/* Easter Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating Easter eggs */}
          {[...Array(8)].map((_, i) => (
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
          {[...Array(15)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute rounded-full animate-sparkle-float"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                background: i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#FFB7C5' : i % 4 === 2 ? '#98FB98' : '#DDA0DD',
                top: `${5 + (i * 7) % 90}%`,
                left: `${2 + (i * 6) % 95}%`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative w-[100%] sm:w-[80%] md:w-[60%] lg:w-[37%]">
  
          {/* Premium Easter Gold Glowing border effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-300 to-green-300 rounded-xl blur opacity-60 animate-pulse-slow" />
  
          {/* Main card container - Easter themed */}
          <div className="relative bg-gradient-to-br from-gray-900/95 via-purple-900/30 to-black/95 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20 shadow-2xl overflow-hidden group hover:border-yellow-400/40 transition-all duration-300">
  
            {/* Inner Easter glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-pink-400/5 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Easter egg pattern overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-5" style={{
              backgroundImage: `radial-gradient(circle at 20% 40%, ${'#FFD700'} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }} />
  
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  {/* Easter Facebook icon with glow */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-pink-400 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/40">
                      <div className="relative">
                        <Facebook className="w-6 h-6 text-black" />
                        <Egg className="absolute -top-1 -right-2 w-3 h-3 text-pink-300 animate-bounce-soft" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-1 group-hover:text-yellow-50 transition-colors">
                      <span className="bg-gradient-to-r from-yellow-400 via-pink-300 to-green-300 bg-clip-text text-transparent">
                        Join 
                       8K+ Egg Hunters
                      </span>
                      <Rabbit className="w-4 h-4 text-pink-400 animate-bounce-soft" />
                    </h3>
                    <p className="text-yellow-400 text-sm group-hover:text-yellow-300 transition-colors flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      Easter Facebook Community
                      <PartyPopper className="w-3 h-3" />
                    </p>
                  </div>
                </div>
  
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full border border-yellow-500/20 group-hover:border-yellow-400/40 transition-all">
                  <Egg className="w-3 h-3 text-yellow-400" />
                  <span className="text-white font-semibold text-sm">
                   8.3K
                  </span>
                  <Users className="w-3 h-3 text-pink-400" />
                </div>
              </div>
  
              {/* Easter Special Message */}
              <div className="mb-4 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-center">
                <p className="text-xs text-yellow-400/80 flex items-center justify-center gap-2">
                  <Flower className="w-3 h-3" />
                  🥚 Special Easter Giveaway Inside! 🐰
                  <Candy className="w-3 h-3" />
                </p>
              </div>
  
              <button
                onClick={handleJoin}
                className="relative w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 transform group-hover:scale-[1.02] overflow-hidden"
              >
                {/* Button glow background - Easter colors */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-pink-400 to-green-400 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity" />
  
                {/* Main button gradient - Easter theme */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-pink-400 rounded-lg" />
  
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-green-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
  
                {/* Shimmer effect */}
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
                </div>
  
                <span className="relative z-10 flex items-center gap-3">
                  <Rabbit className="w-5 h-5 text-black font-extrabold animate-bounce-soft" />
                  <span className='text-black font-extrabold flex items-center gap-2'>
                    Join Easter Community
                    <PartyPopper className="w-4 h-4" />
                  </span>
                </span>
              </button>
  
              <div className="mt-6 flex items-center justify-center gap-4 text-gray-400">
                <div className="flex items-center gap-2 group">
                  <div className="relative">
                    <div className="absolute w-2 h-2 bg-yellow-500 rounded-full blur-xs group-hover:blur-sm transition-all" />
                    <div className="relative w-2 h-2 bg-yellow-500 rounded-full group-hover:bg-yellow-400 transition-colors" />
                  </div>
                  <span className="text-sm group-hover:text-gray-300 transition-colors flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    Easter giveaways
                  </span>
                </div>
                <div className="flex items-center gap-2 group">
                  <div className="relative">
                    <div className="absolute w-2 h-2 bg-pink-400 rounded-full blur-xs group-hover:blur-sm transition-all" />
                    <div className="relative w-2 h-2 bg-pink-400 rounded-full group-hover:bg-pink-300 transition-colors" />
                  </div>
                  <span className="text-sm group-hover:text-gray-300 transition-colors flex items-center gap-1">
                    <Rabbit className="w-3 h-3" />
                    Exclusive eggs
                  </span>
                </div>
                <div className="flex items-center gap-2 group">
                  <div className="relative">
                    <div className="absolute w-2 h-2 bg-green-400 rounded-full blur-xs group-hover:blur-sm transition-all" />
                    <div className="relative w-2 h-2 bg-green-400 rounded-full group-hover:bg-green-300 transition-colors" />
                  </div>
                  <span className="text-sm group-hover:text-gray-300 transition-colors flex items-center gap-1">
                    <PartyPopper className="w-3 h-3" />
                    Live celebrations
                  </span>
                </div>
              </div>
              
              {/* Easter egg hint */}
              <div className="mt-4 text-center">
                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                  <Egg className="w-2 h-2" />
                  🐣 5 Golden Eggs hidden inside the group this Easter! 🥚
                  <Candy className="w-2 h-2" />
                </p>
              </div>
            </div>
          </div>
        </div>

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
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
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
            animation: pulse-slow 4s ease-in-out infinite;
          }
          .group-hover\:animate-shimmer:hover {
            animation: shimmer 1s ease-in-out infinite;
          }
        `}</style>
      </CardContent>
    );
};
  
export default CompactFacebookCTA;