import { useEffect, useState } from "react";
import { Link } from "wouter";

interface Review {
  name: string;
  rating: string;
  title: string;
  text: string;
  date: string;
  totalReviews: string;
}

export default function Testimonials() {
  interface ApiResponse {
  totalReviews: string;
  averageRating: string;
  reviews: Review[];
}

const [reviews, setReviews] = useState<Review[]>([]);
const [totalReviews, setTotalReviews] = useState<string>('0');
const [averageRating, setAverageRating] = useState<string>('N/A');
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("http://localhost:6500/api/trustpilot-reviews")
    .then((res) => res.json())
    .then((data: ApiResponse) => {
      setReviews(data.reviews || []);
      setTotalReviews(data.totalReviews || '0');
      setAverageRating(data.averageRating || 'N/A');
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setReviews([]);
      setTotalReviews('0');
      setAverageRating('N/A');
      setLoading(false);
    });
}, []);


  if (loading)
    return (
      <p className="text-center py-8 text-gray-400">Loading reviews...</p>
    );

  const scrollReviews = [...reviews, ...reviews];
  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          What people say about us
        </h2>

        <div className="overflow-hidden relative">
          <div className="flex animate-scroll whitespace-nowrap space-x-4">
            {scrollReviews.map((r, i) => (
              <div
                key={i}
                className="bg-gray-800 border border-gray-700 rounded-sm p-5 min-w-[280px] max-w-[480px] flex-shrink-0 shadow-md"
              >
                {/* Header: Stars + Verified */}
                <div className="flex items-center mb-3">
                  <div className="flex space-x-1">
                    {[...Array(Number(r.rating))].map((_, idx) => (
                      <svg
                        key={idx}
                        className="w-4 h-4 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 15l-5.878 3.09L5.451 11 0 6.91l6.061-.88L10 0l3.939 6.03 6.061.88L14.549 11l1.329 7.09z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-xs text-gray-400 font-semibold">
                    Verified
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-white text-md mb-2 line-clamp-2">
                  {r.title}
                </h3>

                {/* Text */}
                <p className="text-gray-200 text-sm mb-3 line-clamp-4">
                  {r.text}
                </p>

                {/* Footer: Author + Date */}
                <div className="flex justify-between items-center text-gray-400 text-xs">
                  <span>— {r.name}</span>
                  <span>{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trustpilot summary */}
        <div className="text-center mt-10">
          <p className="text-gray-400 mb-2 text-sm">
            Rated {averageRating} • based on {totalReviews} reviews. Showing our 4 & 5 star reviews.
          </p>
          
          {/* <div className="flex justify-center items-center space-x-2">
            <span className="text-yellow-400 font-bold">Trustpilot</span>
            <div className="flex space-x-1 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 15l-5.878 3.09L5.451 11 0 6.91l6.061-.88L10 0l3.939 6.03 6.061.88L14.549 11l1.329 7.09z" />
                </svg>
              ))}
            </div>
          </div> */}
        </div>

      <div className="flex justify-center mt-5">
  <a
    href="https://www.trustpilot.com/review/ringtoneriches.co.uk"
    target="_blank"
    rel="noopener noreferrer"
    className="flex justify-center border border-2 border-[#0AB67B] cursor-pointer bg-white w-fit items-center space-x-2"
  >
    <span className="flex items-center text-black gap-1 mx-4 my-4">
      Review us on
      <svg
        className="w-5 h-5 text-[#0AB67B]"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M10 15l-5.878 3.09L5.451 11 0 6.91l6.061-.88L10 0l3.939 6.03 6.061.88L14.549 11l1.329 7.09z" />
      </svg>
      Trustpilot
    </span>
  </a>
</div>
      </div>

      {/* Tailwind CSS animation */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </section>
  );
}
