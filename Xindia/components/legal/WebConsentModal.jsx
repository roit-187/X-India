'use client';

import { useState, useEffect } from 'react';
import { X, Shield, RefreshCw } from 'lucide-react';

const DOC_TITLES = {
  BUYER_PRIVACY: 'Privacy Policy',
  BUYER_TERMS: 'Terms & Conditions',
  SELLER_TERMS: 'Seller Marketplace Agreement',
  SELLER_DPA: 'Data Processing Agreement (DPA)',
};

export default function WebConsentModal({ isOpen, docType, onClose }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && docType) {
      loadDoc(lang);
    }
  }, [isOpen, docType, lang]);

  const loadDoc = async (selectedLang) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/legal/documents/${docType}/current?lang=${selectedLang}`);
      const data = await res.json();
      if (data.success && data.document) {
        setDoc(data.document);
      } else {
        setError(data.message || 'Document not found.');
      }
    } catch {
      setError('Unable to load document. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !docType) return null;

  const title = DOC_TITLES[docType] || 'Legal Policy';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} color="#E8581C" />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>{title}</h3>
              {doc?.version && (
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Version {doc.version} • Effective {new Date(doc.effectiveDate).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {doc?.availableLanguages?.length > 1 && (
              <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    backgroundColor: lang === 'en' ? '#E8581C' : '#FFFFFF',
                    color: lang === 'en' ? '#FFFFFF' : '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('hi')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    backgroundColor: lang === 'hi' ? '#E8581C' : '#FFFFFF',
                    color: lang === 'hi' ? '#FFFFFF' : '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  HI (हिंदी)
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#64748B',
                padding: '4px',
                borderRadius: '6px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Loading legal document...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#DC2626' }}>
              <p style={{ fontSize: '15px', fontWeight: 600 }}>{error}</p>
              <button
                onClick={() => loadDoc(lang)}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#E8581C',
                  color: '#FFF',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              style={{
                fontSize: '14px',
                lineHeight: 1.8,
                color: '#334155',
              }}
              dangerouslySetInnerHTML={{ __html: doc?.content || '<p>No content available.</p>' }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#F8FAFC',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#E8581C',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            I Have Read & Understood
          </button>
        </div>
      </div>
    </div>
  );
}
