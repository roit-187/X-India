'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { IndianRupee, Clock, Star, ShieldCheck } from 'lucide-react';

const useCountUp = (end, duration = 2000, shouldStart = false) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime = null;
    const endVal = parseFloat(end);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(eased * endVal);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration, shouldStart]);

  return count;
};

const MetricCard = ({ icon, value, suffix, prefix, label, index, inView }) => {
  const numericValue = parseFloat(value);
  const count = useCountUp(numericValue, 2200, inView);

  const formatValue = () => {
    if (value === '4.8') return count.toFixed(1);
    if (value === '0') return '0';
    return Math.round(count).toLocaleString('en-IN');
  };

  return (
    <motion.div
      className="metric-item"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="metric-icon"
        whileHover={{ scale: 1.15, rotate: -8 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {icon}
      </motion.div>
      <div className="metric-value">
        {prefix}{formatValue()}{suffix}
      </div>
      <div className="metric-label">{label}</div>
    </motion.div>
  );
};

const MetricsSection = () => {
  const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: true });

  const metrics = [
    {
      icon: <IndianRupee size={24} />,
      value: '45',
      prefix: '₹',
      suffix: 'K',
      label: 'Average investment to start a brand on XINDIA'
    },
    {
      icon: <Clock size={24} />,
      value: '15',
      prefix: '',
      suffix: ' Days',
      label: 'Average time from signup to brand launch'
    },
    {
      icon: <Star size={24} />,
      value: '4.8',
      prefix: '',
      suffix: '/5',
      label: 'Average manufacturer trust score'
    },
    {
      icon: <ShieldCheck size={24} />,
      value: '0',
      prefix: '',
      suffix: '',
      label: 'Fake leads guaranteed by our intent scoring system'
    }
  ];

  return (
    <section className="metrics-section" ref={ref}>
      <div className="container">
        <div className="metrics-grid">
          {metrics.map((metric, i) => (
            <MetricCard
              key={i}
              icon={metric.icon}
              value={metric.value}
              suffix={metric.suffix}
              prefix={metric.prefix}
              label={metric.label}
              index={i}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
