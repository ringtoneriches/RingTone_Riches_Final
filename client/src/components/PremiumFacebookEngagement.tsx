import { useEffect, useState } from 'react';
import { Facebook, Users, Zap, Heart } from 'lucide-react';
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

const ValentineFacebookCTA = () => {
  const [memberCount, setMemberCount] = useState('6.6K');
  const [loading, setLoading] = useState(false);
  const displayCount = formatMemberDisplay(memberCount);

  const fetchMemberCount = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/facebook-members');
      const data = await response.json();

      if (data.totalMembers > 0) {
        const formatted =
          data.totalMembers >= 1000
            ? `${(data.totalMembers / 1000).toFixed(1)}K`
            : data.totalMembers.toString();
        setMemberCount(formatted);
      }
    } catch (e) {
      console.error('Failed to fetch member count:', e);
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
    }, 500);
  };

  return (
    <CardContent className="flex justify-center items-center p-6 py-12  bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">

      {/* Floating hearts background */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-500 blur-3xl rounded-full animate-pulse delay-700" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-500/10 rounded-full blur-[80px]" />
          </div>
      <div className="relative w-full sm:w-[80%] md:w-[60%] lg:w-[40%]">

      <div className="absolute -inset-3 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 rounded-3xl blur-xl opacity-60 animate-pulse-slow -z-10" />
  <div className="absolute -inset-2 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 rounded-3xl blur opacity-40 animate-gradient-x -z-10" />
  
  {/* Shine overlay - ALSO BEHIND */}
  <div className="absolute inset-0 rounded-3xl overflow-hidden -z-10">
    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
  </div>
  <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-2xl p-8 border border-rose-500/30 shadow-2xl shadow-rose-500/20 transition-all duration-500 hover:shadow-rose-500/30 hover:border-rose-500/50 z-20">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-pink-500/40 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-pink-500 to-red-600 rounded-xl flex items-center justify-center shadow-xl">
                  <Facebook className="w-7 h-7 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">
                  {loading ? (
                    <span className="inline-block w-24 h-6 bg-gray-700 rounded animate-pulse" />
                  ) : (
                    <>Community • {displayCount}+ Lovers</>
                  )}
                </h3>
                <p className="text-pink-400 text-sm">Valentine’s Facebook Club</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-1.5 bg-black/60 rounded-full border border-pink-500/30">
              <Users className="w-4 h-4 text-pink-400" />
              <span className="text-white font-semibold">
                {loading ? (
                  <span className="inline-block w-8 h-4 bg-gray-700 rounded animate-pulse" />
                ) : (
                  memberCount
                )}
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleJoin}
            className="relative w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg transform transition-all duration-300 hover:scale-[1.03] overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-red-500 to-amber-500 blur opacity-50" />

            {/* Button gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 rounded-xl" />

            {/* Shine */}
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>

            <span className="relative z-10 flex items-center gap-3 text-white font-extrabold">
              <Heart className="w-5 h-5 text-white" />
              Join Valentine Community
              <Zap className="w-5 h-5 text-yellow-300" />
            </span>
          </button>

          {/* Features */}
          <div className="mt-6 flex items-center justify-center gap-6 text-pink-300 text-sm">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400 animate-pulse" />
              Romantic Giveaways
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400 animate-pulse" />
              Love Stories & Events
            </div>
          </div>

        </div>
      </div>
    </CardContent>
  );
};

export default ValentineFacebookCTA;
