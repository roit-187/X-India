'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ShieldCheck, Factory, Target, Globe, Users } from 'lucide-react';

const TrustSection = () => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  const trustItems = [
    {
      icon: <ShieldCheck size={28} />,
      title: 'GST Verified',
      description: "Every manufacturer's GST details against government databases."
    },
    {
      icon: <Factory size={28} />,
      title: 'Factory Verified',
      description: 'Physical factory visits for verified manufacturers.'
    },
    {
      icon: <Target size={28} />,
      title: 'Intent Scored Leads',
      description: 'Every buyer verified and scored before manufacturers see them.'
    },
    {
      icon: <Globe size={28} />,
      title: 'Safe Business Profile',
      description: 'Shareable website at xindia.com/your-business.'
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: i * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <section className="trust-section section" ref={ref}>
      <div className="container">
        <motion.h2
          className="trust-header-text"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          Built on Trust. Backed by Verification.
        </motion.h2>

        <div className="trust-grid">
          {trustItems.map((item, i) => (
            <motion.div
              key={i}
              className="trust-card"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              whileHover={{ y: -6, borderColor: '#E8581C' }}
            >
              <motion.div
                className="trust-icon"
                whileHover={{ scale: 1.15, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {item.icon}
              </motion.div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
