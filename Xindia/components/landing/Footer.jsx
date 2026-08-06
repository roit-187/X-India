'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Footer = () => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  const columns = [
    {
      title: 'For Entrepreneurs',
      links: [
        { name: 'Portal Login', href: '/login' },
        { name: 'Browse Products', href: '/seller-portal/products' },
        { name: 'Explore Opportunities', href: '#' },
        { name: 'Market Research', href: '#' },
      ]
    },
    {
      title: 'For Manufacturers',
      links: [
        { name: 'Seller Portal', href: '/seller-portal/dashboard' },
        { name: 'List Your Business', href: '/seller-portal/portfolio' },
        { name: 'Product Catalog', href: '/seller-portal/products' },
        { name: 'Show Credibility', href: '#' },
      ]
    },
    {
      title: 'Admin & Portal',
      links: [
        { name: 'Admin Dashboard', href: '/admin/dashboard' },
        { name: 'Manufacturers Queue', href: '/admin/manufacturers' },
        { name: 'Buyers Management', href: '/admin/buyers' },
        { name: 'Admin Login', href: '/login?tab=admin' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '#' },
        { name: 'Safety & Trust', href: '#' },
        { name: 'Terms & Conditions', href: '#' },
        { name: 'Privacy Policy', href: '#' },
      ]
    }
  ];

  return (
    <footer className="footer" ref={ref}>
      <div className="container">
        <motion.div
          className="footer-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="x-highlight">X</span>INDIA
            </div>
            <p className="footer-description">
              India's Business Launchpad. Connecting entrepreneurs with verified manufacturers and helping factories find qualified buyers.
            </p>
            <div className="footer-social">
              {['twitter', 'linkedin', 'instagram', 'youtube'].map((social) => (
                <motion.a
                  key={social}
                  href="#"
                  className="social-icon"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {social === 'twitter' && (
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    )}
                    {social === 'linkedin' && (
                      <>
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </>
                    )}
                    {social === 'instagram' && (
                      <>
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </>
                    )}
                    {social === 'youtube' && (
                      <>
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                      </>
                    )}
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {columns.map((col, i) => (
            <div className="footer-column" key={i}>
              <h4>{col.title}</h4>
              <ul className="footer-links">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href={link.href}>{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <div className="footer-bottom">
          <p>© 2024 XINDIA. All rights reserved.</p>
          <p className="made-with-love">
            Made with <span className="heart">❤</span> in India
          </p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
