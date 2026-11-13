'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, MessageCircle, X } from 'lucide-react';
import { trackPortfolioEvent } from '@/lib/portfolioAnalytics';
import PublicProductInquiryForm from './PublicProductInquiryForm';
import './PortfolioContactActions.css';

export default function PortfolioProductAppActions({ appUrl, playStoreUrl, sellerSlug, productId, product, children, listenForContact = false }) {
  const [showGetApp, setShowGetApp] = useState(false);
  const [showDirectRfq, setShowDirectRfq] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const timerRef = useRef(null);
  const visibilityRef = useRef(null);
  const formRef = useRef(null);
  const buttonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!listenForContact) return;
    const handleContact = (event) => {
      if (event.detail?.slug && event.detail.slug !== sellerSlug) return;
      buttonRef.current?.click();
    };
    window.addEventListener('xindia:portfolio-contact', handleContact);
    return () => window.removeEventListener('xindia:portfolio-contact', handleContact);
  }, [listenForContact, sellerSlug]);

  useEffect(() => {
    if (!showGetApp && !showDirectRfq) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button, a')?.focus();
    const trapFocus = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button, a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trapFocus);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', trapFocus); previous?.focus?.(); };
  }, [showGetApp, showDirectRfq]);

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    if (visibilityRef.current) document.removeEventListener('visibilitychange', visibilityRef.current);
  }, []);

  useEffect(() => {
    if (showForm) formRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }, [showForm]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (showGetApp) {
        setShowGetApp(false);
        setShowDirectRfq(true);
      } else setShowDirectRfq(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showGetApp]);

  const promptForApp = () => {
    trackPortfolioEvent(sellerSlug, 'contact_click', productId ? { productId } : {});
    window.clearTimeout(timerRef.current);
    if (visibilityRef.current) document.removeEventListener('visibilitychange', visibilityRef.current);
    if (!/Android/i.test(window.navigator.userAgent)) {
      setShowGetApp(true);
      return;
    }
    const onVisibilityChange = () => {
      if (document.hidden) {
        window.clearTimeout(timerRef.current);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
    visibilityRef.current = onVisibilityChange;
    document.addEventListener('visibilitychange', onVisibilityChange);
    timerRef.current = window.setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (!document.hidden) setShowGetApp(true);
    }, 1400);
    window.location.assign(appUrl);
  };

  const declineApp = () => {
    setShowGetApp(false);
    setShowDirectRfq(true);
  };

  const openDirectRfq = () => {
    setShowDirectRfq(false);
    setShowForm(true);
  };

  return (
    <>
      <div className="public-product-actions">
        <button ref={buttonRef} type="button" className="public-product-primary" onClick={promptForApp}><MessageCircle size={16} /> Chat with this business</button>
      </div>

      {showForm && product && <div ref={formRef}><PublicProductInquiryForm product={product} sellerSlug={sellerSlug} /></div>}
      {showForm && !product && children && <div ref={formRef}>{children}</div>}

      {showGetApp && (
        <div className="public-choice-backdrop" role="presentation" onClick={declineApp}>
          <section ref={dialogRef} className="public-choice-dialog" role="dialog" aria-modal="true" aria-labelledby="get-xindia-title" onClick={(event) => event.stopPropagation()}>
            <button className="public-choice-close" type="button" onClick={declineApp} aria-label="Close"><X size={18} /></button>
            <div className="public-choice-icon"><Download size={23} /></div>
            <h2 id="get-xindia-title">Get XINDIA to chat with this business</h2>
            <p>Contact this business in the XINDIA app{productId ? ' with this product included' : ''}.</p>
            {playStoreUrl ? <a className="public-choice-primary" href={playStoreUrl} target="_blank" rel="noopener noreferrer" onClick={() => { trackPortfolioEvent(sellerSlug, 'play_store_click', productId ? { productId } : {}); declineApp(); }}>Get XINDIA</a> : <p role="status">Loading app link…</p>}
            <button type="button" className="public-choice-secondary" onClick={declineApp}>No thanks</button>
          </section>
        </div>
      )}

      {showDirectRfq && (
        <div className="public-choice-backdrop" role="presentation" onClick={() => setShowDirectRfq(false)}>
          <section ref={dialogRef} className="public-choice-dialog" role="dialog" aria-modal="true" aria-labelledby="direct-rfq-title" onClick={(event) => event.stopPropagation()}>
            <button className="public-choice-close" type="button" onClick={() => setShowDirectRfq(false)} aria-label="Close"><X size={18} /></button>
            <div className="public-choice-icon"><MessageCircle size={23} /></div>
            <h2 id="direct-rfq-title">Send a direct RFQ without downloading the app?</h2>
            <p>Your inquiry{productId ? ' will include this product and' : ' will'} go to the seller through XINDIA.</p>
            <button type="button" className="public-choice-primary" onClick={openDirectRfq}>Yes, send an RFQ</button>
            <button type="button" className="public-choice-secondary" onClick={() => setShowDirectRfq(false)}>Maybe later</button>
          </section>
        </div>
      )}
    </>
  );
}
