export default function Testimonials() {
  const testimonials = [
    {
      rating: 5,
      text: "Best competition page ever. Fast payouts and lovely people running it. All members are...",
      author: "Jayde Yeeles",
      timeAgo: "22 hours ago"
    },
    {
      rating: 5,
      text: "Changes people's life or put a happy smile on people's faces. Hopefully I can get a...",
      author: "Linden Gallagher",
      timeAgo: "2 days ago"
    },
    {
      rating: 5,
      text: "Brilliant experience",
      author: "Lucy Snowdon",
      timeAgo: "2 days ago"
    },
    {
      rating: 5,
      text: "Fantastic game Fast payouts and great fun",
      author: "MRGARYARMSTRONG",
      timeAgo: "2 days ago"
    },
    {
      rating: 5,
      text: "Excellent games, pay straight in to your bank with your winning. Brian is so funny...",
      author: "Jeeraporn Rowe",
      timeAgo: "2 days ago"
    }
  ];

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          What people say about us
        </h2>
        <div className="testimonial-slider overflow-hidden">
          <div className="testimonial-track flex space-x-6 animate-scroll">
            {/* Original testimonials */}
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border min-w-80 flex-shrink-0" data-testid={`testimonial-${index}`}>
                <div className="flex items-center mb-4">
                  <div className="flex text-primary space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <i key={i} className="fas fa-star"></i>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">Verified</span>
                </div>
                <p className="text-foreground mb-4" data-testid={`testimonial-text-${index}`}>
                  "{testimonial.text}"
                </p>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium" data-testid={`testimonial-author-${index}`}>
                    {testimonial.author},
                  </span> {testimonial.timeAgo}
                </div>
              </div>
            ))}

            {/* Duplicate testimonials for seamless loop */}
            {testimonials.map((testimonial, index) => (
              <div key={`dup-${index}`} className="bg-card rounded-xl p-6 border border-border min-w-80 flex-shrink-0">
                <div className="flex items-center mb-4">
                  <div className="flex text-primary space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <i key={i} className="fas fa-star"></i>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">Verified</span>
                </div>
                <p className="text-foreground mb-4">"{testimonial.text}"</p>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{testimonial.author},</span> {testimonial.timeAgo}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-muted-foreground" data-testid="text-trustpilot-rating">
            Rated 4.7 • based on 2,099 reviews. Showing our 4 & 5 star reviews.
          </p>
          <div className="flex items-center justify-center mt-2">
            <span className="text-primary font-bold mr-2">Trustpilot</span>
            <div className="flex text-primary space-x-1">
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
