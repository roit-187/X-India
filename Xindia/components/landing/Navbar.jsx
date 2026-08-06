'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container">
        <a href="#" className="navbar-logo">
          <span className="logo-x">X</span>INDIA
        </a>

        <ul className="navbar-links">
          <li className="nav-dropdown">
            <a href="#entrepreneurs">
              For Entrepreneurs <span className="nav-dropdown-arrow">▾</span>
            </a>
          </li>
          <li className="nav-dropdown">
            <a href="#manufacturers">
              For Manufacturers <span className="nav-dropdown-arrow">▾</span>
            </a>
          </li>
          <li>
            <a href="/login" className="btn-download-nav">Login</a>
          </li>
        </ul>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)',
              padding: '16px 24px',
              borderTop: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            {[
              { label: 'For Entrepreneurs', href: '#entrepreneurs' },
              { label: 'For Manufacturers', href: '#manufacturers' },
              { label: 'Login', href: '/login' },
            ].map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'block',
                  padding: '12px 0',
                  color: '#334155',
                  fontSize: '15px',
                  fontWeight: 500,
                  borderBottom: '1px solid #f1f5f9'
                }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
