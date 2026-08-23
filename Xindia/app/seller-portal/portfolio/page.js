'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Badge from '@/components/admin/Badge';
import Modal from '@/components/admin/Modal';
import QRCode from 'qrcode';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle,
  Edit3,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://xindia.com');

export default function SellerPortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Story inline editing
  const [aboutStory, setAboutStory] = useState('');
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [storySuccess, setStorySuccess] = useState('');

  // Publish / Unpublish states
  const [publishing, setPublishing] = useState(false);
  const [unpublishModal, setUnpublishModal] = useState(false);
  const [publishSuccessUrl, setPublishSuccessUrl] = useState('');
  const [publishError, setPublishError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [portRes, statRes] = await Promise.all([
        fetch('/api/seller/portfolio'),
        fetch('/api/seller/dashboard/stats'),
      ]);

      const portData = await portRes.json();
      const statData = await statRes.json();

      if (portData.success) {
        setPortfolio(portData.manufacturer);
        setAboutStory(portData.manufacturer.portfolioAbout || '');
      } else {
        setError(portData.message || 'Failed to load portfolio');
      }

      if (statData.success) {
        setStats(statData);
      }
    } catch (err) {
      console.error(err);
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate QR Code if portfolio is published
  useEffect(() => {
    if (portfolio?.slug) {
      const url = portfolio.url || `${SITE_URL}/p/${portfolio.slug}`;
      QRCode.toDataURL(url, { width: 220, margin: 1 })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch(console.error);
    }
  }, [portfolio]);

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveStory = async () => {
    if (aboutStory.trim().length < 80) {
      alert('Company story must be at least 80 characters long.');
      return;
    }

    setIsSavingStory(true);
    setStorySuccess('');
    try {
      const formData = new FormData();
      formData.append('portfolioAbout', aboutStory.trim());

      const res = await fetch('/api/seller/portfolio', {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setStorySuccess('Storefront story updated successfully!');
        setTimeout(() => setStorySuccess(''), 4000);
        loadData();
      } else {
        alert(data.message || 'Failed to update story');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving story.');
    } finally {
      setIsSavingStory(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError('');
    setPublishSuccessUrl('');

    try {
      const res = await fetch('/api/seller/portfolio/publish', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const liveUrl = data.url || `${SITE_URL}/p/${data.slug}`;
        setPublishSuccessUrl(liveUrl);

        try {
          const dataUrl = await QRCode.toDataURL(liveUrl, { width: 220, margin: 1 });
          setQrDataUrl(dataUrl);
        } catch (qrErr) {
          console.error('QR generation failed:', qrErr);
        }

        loadData();
      } else {
        if (data.missingFields) {
          setPublishError(`Missing required fields to publish: ${data.missingFields.join(', ')}`);
        } else if (data.code === 'PLAN_REQUIRED') {
          setPublishError(data.message || 'Active seller plan required to publish portfolio.');
        } else {
          setPublishError(data.message || 'Failed to publish portfolio');
        }
      }
    } catch (err) {
      console.error(err);
      setPublishError('Publish failed due to a network connection error.');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      const res = await fetch('/api/seller/portfolio/unpublish', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUnpublishModal(false);
        loadData();
      } else {
        alert(data.message || 'Failed to unpublish');
      }
    } catch (err) {
      console.error(err);
      alert('Unpublish failed');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, padding: '40px 0' }}>
        <p style={{ color: 'var(--sp-text-med)' }}>Loading storefront status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, padding: '40px 0' }}>
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: 16, borderRadius: 8 }}>
          {error}
        </div>
      </div>
    );
  }

  const isPublished = portfolio?.portfolioStatus === 'published';
  const liveUrl = portfolio?.slug ? `${SITE_URL}/p/${portfolio.slug}` : '';
  const canPublish = stats ? stats.completedCount >= stats.totalRequired : false;
  const completionPct = stats?.totalRequired ? Math.round((stats.completedCount / stats.totalRequired) * 100) : 0;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--sp-text)' }}>Business Portfolio</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--sp-text-med)' }}>
            Manage your public business portfolio URL, review mandatory publish requirements, and download your branded QR card.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <Badge label={isPublished ? 'Live on Marketplace' : 'Draft Mode'} variant={isPublished ? 'published' : 'draft'} />
            {portfolio?.slug && (
              <span style={{ fontSize: 13, color: 'var(--sp-text-med)' }}>
                Storefront Slug: <strong style={{ color: 'var(--sp-text)' }}>{portfolio.slug}</strong>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            href="/seller-portal/profile"
            className="seller-btn seller-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13.5 }}
          >
            <Edit3 size={15} />
            Edit Full Profile
          </Link>

          {isPublished ? (
            <button className="seller-btn seller-btn-danger" onClick={() => setUnpublishModal(true)}>
              Take Offline
            </button>
          ) : (
            <button
              className="seller-btn seller-btn-primary"
              onClick={handlePublish}
              disabled={!canPublish || publishing}
            >
              {publishing ? 'Publishing...' : 'Publish to Marketplace'}
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {publishError && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#B91C1C',
            padding: '14px 16px',
            borderRadius: 10,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
          }}
        >
          <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
          <span>{publishError}</span>
        </div>
      )}

      {/* Live Storefront Banner with QR Code Card */}
      {isPublished && liveUrl && (
        <div
          className="seller-card"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#fff',
            borderColor: '#334155',
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    background: '#10B981',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  LIVE ONLINE
                </span>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>Verified Buyer Storefront</span>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 10px', color: '#fff' }}>
                {portfolio.name || 'Your Company Storefront'}
              </h2>

              <p style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 16, lineHeight: 1.5 }}>
                Your storefront is currently public and receiving discovery traffic from verified B2B buyers on Xindia.
              </p>

              {/* URL Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 16,
                  gap: 10,
                }}
              >
                <Globe size={16} color="#38BDF8" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: '#F1F5F9', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {liveUrl}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(liveUrl)}
                  className="seller-btn"
                  style={{
                    background: copied ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    padding: '5px 12px',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="seller-btn seller-btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                >
                  View Live Storefront <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* QR Code Standee Card */}
            {qrDataUrl && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: 16,
                  color: '#0F172A',
                  textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  flexShrink: 0,
                  width: 190,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Storefront QR Code" style={{ width: 158, height: 158, borderRadius: 8, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sp-text-med)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Scan to View Storefront
                </div>
                <a
                  href={qrDataUrl}
                  download={`${portfolio.slug || 'company'}-storefront-qr.png`}
                  className="seller-btn seller-btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontSize: 11.5,
                    padding: '6px 10px',
                    textDecoration: 'none',
                    width: '100%',
                  }}
                >
                  <Download size={13} /> Download QR
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandatory Requirements Status Card */}
      <div className="seller-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--sp-text)' }}>
              Mandatory Publish Checklist
            </h3>
            <span style={{ fontSize: 12.5, color: 'var(--sp-text-med)' }}>
              {canPublish
                ? 'All mandatory requirements fulfilled. Your storefront is eligible to publish.'
                : 'Complete the remaining required items to publish your storefront live.'}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: canPublish ? '#059669' : '#D97706' }}>
            {stats?.completedCount || 0} / {stats?.totalRequired || 6} ({completionPct}%)
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
          <div
            style={{
              background: canPublish ? '#10B981' : '#E8581C',
              height: '100%',
              width: `${completionPct}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Checklist items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {stats?.mandatoryFieldsComplete &&
            Object.entries(stats.mandatoryFieldsComplete).map(([key, isDone]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: isDone ? '#ECFDF5' : '#FFFBEB',
                  border: isDone ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                  color: isDone ? '#065F46' : '#92400E',
                }}
              >
                {isDone ? <CheckCircle size={16} color="#059669" /> : <AlertCircle size={16} color="#D97706" />}
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {key === 'portfolioAbout' ? 'About Story (80+ chars)' : key === 'manufacturingPlants' ? 'Plant Photos' : key}
                </span>
              </div>
            ))}
        </div>

        {!canPublish && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--sp-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              href="/seller-portal/profile"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--sp-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
              }}
            >
              Fill Missing Details in My Profile <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Storefront Story & Customer-Facing Overview */}
      <div className="seller-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--sp-text)' }}>
              Storefront Customer Story
            </h3>
            <span style={{ fontSize: 12.5, color: 'var(--sp-text-med)' }}>
              The core brand overview and company introduction displayed prominently at the top of your public storefront.
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: (aboutStory || '').length >= 80 ? '#059669' : '#D97706',
            }}
          >
            {(aboutStory || '').length} / 80 min characters
          </span>
        </div>

        {storySuccess && (
          <div style={{ background: '#D1FAE5', border: '1px solid #10B981', color: '#047857', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
            {storySuccess}
          </div>
        )}

        <textarea
          className="seller-input"
          style={{ width: '100%', minHeight: 120, marginBottom: 12 }}
          placeholder="Provide a comprehensive introduction to your company, factory history, production quality standards, and industry achievements..."
          value={aboutStory}
          onChange={(e) => setAboutStory(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--sp-text-med)' }}>
            Must be at least 80 characters long to publish live.
          </span>
          <button
            type="button"
            className="seller-btn seller-btn-primary"
            onClick={handleSaveStory}
            disabled={isSavingStory}
          >
            {isSavingStory ? 'Saving Story...' : 'Save Storefront Story'}
          </button>
        </div>
      </div>

      {/* Unpublish Confirmation Modal */}
      <Modal open={unpublishModal} onClose={() => setUnpublishModal(false)} title="Take Storefront Offline">
        <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--sp-text)' }}>
          Are you sure you want to unpublish your storefront? It will be switched to <strong>Draft Mode</strong> and hidden from buyer searches until republished.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="seller-btn seller-btn-secondary" onClick={() => setUnpublishModal(false)}>
            Cancel
          </button>
          <button className="seller-btn seller-btn-danger" onClick={handleUnpublish}>
            Take Offline
          </button>
        </div>
      </Modal>
    </div>
  );
}
