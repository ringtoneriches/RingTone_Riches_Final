import { useEffect, useState } from 'react';
import { Facebook, Users, Zap, CheckCircle } from 'lucide-react';
import { CardContent } from './ui/card';


const formatMemberDisplay = (countStr:any) => {
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
    <CardContent className="flex justify-center items-center p-6 py-10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
    <div className="relative w-[100%] md:w-[37%]">
        
      {/* Premium Gold Glowing border effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-xl blur opacity-60" />
      
      {/* Main card container */}
      <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-2xl overflow-hidden group hover:border-yellow-500/30 transition-all duration-300">
        
        {/* Inner glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-400/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Facebook icon with glow */}
              <div className="relative">
                <div className="absolute -inset-1 bg-yellow-500/30 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/40">
                  <Facebook className="w-6 h-6 text-black" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-yellow-50 transition-colors">
                  Join {displayCount}+ Members
                </h3>
                <p className="text-yellow-400 text-sm group-hover:text-yellow-300 transition-colors">
                  Facebook Community
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full border border-yellow-500/20 group-hover:border-yellow-500/40 transition-all">
              <Users className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-semibold">
              {memberCount}
              </span>
            </div>
          </div>
  
          <button
            onClick={handleJoin}
            className="relative w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 transform group-hover:scale-[1.02] overflow-hidden"
          >
            {/* Button glow background */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity" />
            
            {/* Main button gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg" />
            
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
            </div>
            
            <span className="relative z-10 flex items-center gap-3">
              <Zap className="w-5 h-5 text-black font-extrabold" />
              <span className='text-black font-extrabold'>Join Facebook Community</span>
            </span>
          </button>
  
          <div className="mt-6 flex items-center justify-center gap-4 text-gray-400">
            <div className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute w-2 h-2 bg-yellow-500 rounded-full blur-xs group-hover:blur-sm transition-all" />
                <div className="relative w-2 h-2 bg-yellow-500 rounded-full group-hover:bg-yellow-400 transition-colors" />
              </div>
              <span className="text-sm group-hover:text-gray-300 transition-colors">Exclusive content</span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute w-2 h-2 bg-yellow-500 rounded-full blur-xs group-hover:blur-sm transition-all" />
                <div className="relative w-2 h-2 bg-yellow-500 rounded-full group-hover:bg-yellow-400 transition-colors" />
              </div>
              <span className="text-sm group-hover:text-gray-300 transition-colors">Live updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CardContent>
  );
};

export default CompactFacebookCTA ;
