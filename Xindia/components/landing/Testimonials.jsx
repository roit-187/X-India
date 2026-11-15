'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import './LandingCommunity.css';

export default function Testimonials() {
  const [registeredMembers, setRegisteredMembers] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/api/public/platform-stats', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (active && result?.success && Number.isSafeInteger(result.registeredMembers)) {
          setRegisteredMembers(result.registeredMembers);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <section className="testimonials-section section" id="community">
      <div className="container landing-community">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="landing-community-icon"><Users size={30} /></span>
          <div className="section-label">The XINDIA community</div>
          <h2 className="section-title">Businesses grow through connections.</h2>
          {registeredMembers > 1000 && (
            <p className="landing-community-count">
              <strong>{registeredMembers.toLocaleString('en-IN')}</strong> registered {registeredMembers === 1 ? 'member' : 'members'} and counting
            </p>
          )}
          <p className="section-subtitle">Explore products, business opportunities and seller portfolios in the XINDIA app.</p>
        </motion.div>
      </div>
    </section>
  );
}
