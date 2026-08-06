'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, Compass, Search, Handshake, UserPlus, MessageSquare, CreditCard } from 'lucide-react';

const HowItWorks = () => {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: true });

  const entrepreneurSteps = [
    {
      icon: <Compass size={18} />,
      title: "Browse business opportunities",
      description: "Find opportunities that match your budget. Filter by investment from ₹25,000 to 15 lakh."
    },
    {
      icon: <Search size={18} />,
      title: "Read real market research",
      description: "See profit potential, competitor analysis, and exact launch costs before investing a rupee."
    },
    {
      icon: <Handshake size={18} />,
      title: "Connect with verified manufacturers",
      description: "Connect directly with verified manufacturers who help you launch in days not months."
    }
  ];

  const manufacturerSteps = [
    {
      icon: <UserPlus size={18} />,
      title: "Create your free professional profile",
      description: "Create your free professional profile and website at xindia.com/your-business."
    },
    {
      icon: <MessageSquare size={18} />,
      title: "Receive qualified leads from entrepreneurs",
      description: "Receive qualified leads from entrepreneurs who have confirmed their budget and requirement."
    },
    {
      icon: <CreditCard size={18} />,
      title: "Pay only for leads you choose to unlock",
      description: "Pay only for leads you choose to unlock. See buyer contact before spending a single credit."
    }
  ];

  const panelVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: i * 0.2,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: 0.3 + i * 0.12,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <section className="how-it-works section" id="how-it-works" ref={ref}>
      <div className="container">
        <div className="hiw-grid">
          {/* Entrepreneurs Panel */}
          <motion.div
            className="hiw-panel entrepreneurs"
            custom={0}
            variants={panelVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <div className="hiw-label">How It Works</div>
            <h3 className="hiw-panel-title">
              For <span className="accent">Entrepreneurs</span>
            </h3>
            <ul className="hiw-steps">
              {entrepreneurSteps.map((step, i) => (
                <motion.li
                  key={i}
                  className="hiw-step"
                  custom={i}
                  variants={stepVariants}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                >
                  <div className="hiw-step-number">{i + 1}</div>
                  <div className="hiw-step-content">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <motion.a
              href="#explore"
              className="hiw-cta orange"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore Business Opportunities
              <span className="hiw-cta-arrow">→</span>
            </motion.a>
          </motion.div>

          {/* Manufacturers Panel */}
          <motion.div
            className="hiw-panel manufacturers"
            custom={1}
            variants={panelVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <div className="hiw-label">How It Works</div>
            <h3 className="hiw-panel-title">
              For <span className="accent">Manufacturers</span>
            </h3>
            <ul className="hiw-steps">
              {manufacturerSteps.map((step, i) => (
                <motion.li
                  key={i}
                  className="hiw-step"
                  custom={i}
                  variants={stepVariants}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                >
                  <div className="hiw-step-number">{i + 1}</div>
                  <div className="hiw-step-content">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <motion.a
              href="#list-business"
              className="hiw-cta blue"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              List Your Business Free
              <span className="hiw-cta-arrow">→</span>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
