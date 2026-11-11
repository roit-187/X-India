'use client';

import { MotionConfig, motion } from 'framer-motion';

export function PortfolioMotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export default function PortfolioRouteMotion({ children, pageKey }) {
  return (
    <motion.div
      key={pageKey}
      className="portfolio-route-motion"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
