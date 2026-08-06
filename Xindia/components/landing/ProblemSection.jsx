'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { HelpCircle, Search, BarChart3 } from 'lucide-react';

const ProblemSection = () => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  const problems = [
    {
      icon: <HelpCircle size={32} />,
      title: "Don't know which business to start",
      description: "Too many options. No proper guidance. High risk. Most first-time entrepreneurs struggle to choose the right business."
    },
    {
      icon: <Search size={32} />,
      title: "Can't find trustworthy manufacturers",
      description: "Fake listings. No verification. Trust issues. Finding reliable manufacturers to produce quality products is a nightmare."
    },
    {
      icon: <BarChart3 size={32} />,
      title: "Don't know if it will be profitable",
      description: "No market data. No profit clarity. High uncertainty. Starting without financial projections leads to failure."
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
    <section className="problem-section" ref={ref}>
      <div className="container">
        <motion.p
          className="problem-statement"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          Starting a business in India is harder than it should be.
        </motion.p>

        <div className="problem-cards">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              className="problem-card"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <motion.div
                className="problem-icon"
                whileHover={{ scale: 1.15, rotate: -8 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {problem.icon}
              </motion.div>
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="problem-solution"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2>
            <span className="highlight">XINDIA</span> solves all three. At once.
          </h2>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
