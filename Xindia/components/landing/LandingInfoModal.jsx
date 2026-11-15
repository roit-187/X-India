'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ArrowUpRight, Check, Globe, Layers, MessageCircle, Palette, QrCode, Search, X } from 'lucide-react';
import { usePlayStoreUrl } from '@/lib/usePlayStoreUrl';
import './LandingInfoModal.css';

export default function LandingInfoModal({ title, description, points, onClose, variant = 'portfolio' }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [custom, setCustom] = useState(false);
  const id = useId();
  const playStoreUrl = usePlayStoreUrl();
  const opportunities = variant === 'opportunities';

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'Tab') {
        const focusable = [...dialogRef.current.querySelectorAll('button, a[href]')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="landing-info-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="landing-info-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <button ref={closeRef} type="button" className="landing-info-close" aria-label="Close" onClick={onClose}><X size={22} /></button>
        <div className={`landing-feature-art ${opportunities ? 'is-opportunity' : custom ? 'is-custom' : 'is-catalogue'}`}>
          {opportunities ? <>
            <Image className="landing-feature-background" src="/landing/opportunity-illustration.png" alt="Rocket launching through clouds, illustrating a new business journey" fill sizes="(max-width: 700px) 100vw, 440px" />
            <span className="landing-feature-kicker">YOUR NEXT CHAPTER</span>
            <div className="landing-feature-journey">
              <span><Search size={19} /> Discover opportunities</span>
              <span><Layers size={19} /> Explore the details</span>
              <span><MessageCircle size={19} /> Connect with sellers</span>
            </div>
            <small className="landing-feature-caption">Feature illustration</small>
          </> : custom ? <>
            <div className="landing-design-window" aria-label="Illustration of a custom website layout">
              <div className="landing-design-chrome"><i /><i /><i /><Globe size={14} /></div>
              <div className="landing-design-hero"><Palette size={34} /><strong>Your brand.<br />Your own look.</strong><span>Products · Company · Contact</span></div>
              <div className="landing-design-tiles"><div /><div /><div /></div>
            </div>
            <div className="landing-design-stamp"><Palette size={18} /> Designed around your business</div>
            <small className="landing-feature-caption">Design illustration · final website created by our team</small>
          </> : <>
            <div className="landing-catalogue-heading"><Globe size={18} /><span>Your catalogue.<br /><strong>Ready to share.</strong></span></div>
            <div className="landing-screen-frame"><Image src="/landing/catalogue-screen.png" alt="Captured XINDIA product detail screen showing a supplier's furniture product and image gallery" width={390} height={844} sizes="(max-width: 700px) 190px, 225px" /></div>
            <span className="landing-qr-stamp"><QrCode size={25} /> Share through your QR</span>
            <small className="landing-feature-caption">Catalogue screen preview · product details may change</small>
          </>}
        </div>
        <div className="landing-info-content">
          <span className="landing-info-eyebrow">Discover XINDIA</span>
          <h2 id={`${id}-title`}>{custom ? 'A website that feels like your business' : title}</h2>
          {!opportunities && <div className="landing-feature-switch" role="group" aria-label="Compare portfolio options">
            <button type="button" aria-pressed={!custom} onClick={() => setCustom(false)}>Standard portfolio</button>
            <button type="button" aria-pressed={custom} onClick={() => setCustom(true)}>Custom website</button>
          </div>}
          <p id={`${id}-description`}>{custom ? 'Want a distinct design? Request a personalised website from the XINDIA team, with scope and price shown in the app.' : description}</p>
          <ul>{(custom ? ['A design tailored to your brand and catalogue.', 'Hosted under XINDIA or connected to your own domain.', 'Request the service in the app; our team handles the build.'] : points).map((point) => <li key={point}><Check size={17} /><span>{point}</span></li>)}</ul>
          <div className="landing-info-action-wrap"><a className="landing-info-action" href={playStoreUrl} target="_blank" rel="noopener noreferrer">Get XINDIA now <ArrowUpRight size={20} /></a><small>Available on Android · opens Google Play</small></div>
        </div>
      </div>
    </div>, document.body
  );
}
