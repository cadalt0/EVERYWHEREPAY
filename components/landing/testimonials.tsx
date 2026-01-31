'use client';

const testimonials = [
  {
    quote:
      'Reduced our payment settlement time from days to seconds. EVERYWHEREPAY is exactly what the DeFi ecosystem needed.',
    author: 'X██x ██en',
    role: 'Founder, █████low ████',
    rating: 5,
  },
  {
    quote:
      'The multi-send feature saved us 10 hours per week. The UI is intuitive and the performance is incredible.',
    author: '██rah ███████ez',
    role: 'Operations, ██████ ███',
    rating: 5,
  },
  {
    quote:
      'The seamless cross-chain experience transformed how we manage payments. Faster, cheaper, and incredibly reliable.',
    author: '██mes ███son',
    role: 'Treasury Manager, ████DAO',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32 border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="mb-4 inline-block">
            <span className="inline-block w-2 h-2 bg-primary mr-3"></span>
            <span className="text-sm font-mono text-muted-foreground">
              WHAT USERS SAY
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-mono">
            Trusted by teams worldwide
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="border border-border p-8 rounded-lg hover:border-accent transition-all duration-300"
            >
              <div className="mb-6 flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-primary rounded-full"></div>
                ))}
              </div>

              <blockquote className="font-mono text-sm mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              <div>
                <div className="font-semibold font-mono">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
