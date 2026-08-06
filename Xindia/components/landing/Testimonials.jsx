'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { MapPin, ArrowRight } from 'lucide-react';

const Testimonials = () => {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: true });

  const testimonials = [
    {
      name: 'Rahul Verma',
      initials: 'RV',
      location: 'Kanpur, UP',
      business: 'Custom Packaging Business',
      investment: '₹38,000',
      revenue: '₹1,25,000+',
      quote: '"XINDIA helped me find the right manufacturer and launch my brand in just 18 days."',
      gradient: 'linear-gradient(135deg, #E8581C, #FF6B2E)'
    },
    {
      name: 'Sneha Patil',
      initials: 'SP',
      location: 'Pune, MH',
      business: 'Herbal Skincare Brand',
      investment: '₹52,000',
      revenue: '₹1,80,000+',
      quote: '"The market research and profit calculator were game changers for me."',
      gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)'
    },
    {
      name: 'Arjun Mehta',
      initials: 'AM',
      location: 'Ahmedabad, GJ',
      business: 'Stainless Steel Bottles Brand',
      investment: '₹75,000',
      revenue: '₹2,40,000+',
      quote: '"Direct access to verified manufacturers saved me months of struggle."',
      gradient: 'linear-gradient(135deg, #10B981, #34D399)'
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.15,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <section className="testimonials-section section" id="success-stories" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-label">Success Stories</div>
          <h2 className="section-title">
            Real People. Real Businesses.<br />Real Results.
          </h2>
          <p className="section-subtitle">
            Thousands of entrepreneurs and manufacturers have transformed their businesses with XINDIA.
          </p>
        </motion.div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="testimonial-card"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              whileHover={{ y: -6 }}
            >
              <div className="testimonial-header">
                <div
                  className="testimonial-avatar"
                  style={{ background: t.gradient }}
                >
                  {t.initials}
                </div>
                <div className="testimonial-info">
                  <h4>{t.name}</h4>
                  <p>
                    <MapPin size={12} />
                    {t.location}
                  </p>
                </div>
              </div>

              <div className="started-badge">
                <span className="started-badge-dot" />
                Started: {t.business}
              </div>

              <div className="testimonial-meta">
                <div className="testimonial-meta-item">
                  <span className="testimonial-meta-label">Investment</span>
                  <span className="testimonial-meta-value">{t.investment}</span>
                </div>
                <div className="testimonial-meta-item">
                  <span className="testimonial-meta-label">Monthly Revenue</span>
                  <span className="testimonial-meta-value">{t.revenue}</span>
                </div>
              </div>

              <p className="testimonial-quote">{t.quote}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="testimonials-cta"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <a href="#stories" className="link-primary">
            Read More Stories <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
