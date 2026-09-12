'use client';

import { useState } from 'react';
import {
  Send,
  Megaphone,
  Users,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Info,
  Layers,
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const PRESETS = [
  {
    id: 'maintenance',
    name: 'Scheduled Maintenance',
    icon: '🛠️',
    title: 'Scheduled Maintenance Notice',
    body: 'Xindia systems will be briefly unavailable for scheduled upgrades tonight at 02:00 AM IST. Please complete any active inquiries beforehand.',
    actionUrl: '',
    audience: 'ALL',
  },
  {
    id: 'update',
    name: 'Mandatory App Update',
    icon: '📲',
    title: 'Critical App Update Available',
    body: 'A new version of Xindia is ready on Google Play with enhanced security and performance. Please update now to continue uninterrupted.',
    actionUrl: 'https://play.google.com/store/apps/details?id=com.xindia.marketplace',
    audience: 'ALL',
  },
  {
    id: 'seller_inquiry',
    name: 'Seller Leads Reminder',
    icon: '💼',
    title: 'High Buyer Inquiries Today',
    body: 'Verified buyers are requesting quotes for bulk machinery and apparel. Check your inquiries inbox now to close deals quickly!',
    actionUrl: '/seller-portal/dashboard',
    audience: 'SELLERS',
  },
  {
    id: 'buyer_deals',
    name: 'Buyer Discovery Promo',
    icon: '🏷️',
    title: 'New Verified Manufacturers Added',
    body: 'Explore newly onboarded industrial suppliers with verified GST and direct factory rates across India.',
    actionUrl: '/',
    audience: 'BUYERS',
  },
];

export default function AdminBroadcastPage() {
  const { isSuperAdmin, role, loaded } = useAdminPermissions();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [actionUrl, setActionUrl] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const applyPreset = (preset) => {
    setTitle(preset.title);
    setBody(preset.body);
    setTargetAudience(preset.audience);
    setActionUrl(preset.actionUrl);
    setResult(null);
    setErrorMsg('');
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMsg('Both Title and Message Body are required to broadcast.');
      return;
    }
    setErrorMsg('');
    setIsConfirmOpen(true);
  };

  const handleSendBroadcast = async () => {
    setSending(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          targetAudience,
          actionUrl: actionUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch broadcast');
      }

      setResult({
        ...data,
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsConfirmOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred while dispatching the push notification.');
      setIsConfirmOpen(false);
    } finally {
      setSending(false);
    }
  };

  if (!loaded) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--adm-text-light)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        Loading Broadcast Hub...
      </div>
    );
  }

  // Permission check
  const canBroadcast = isSuperAdmin || role === 'PLATFORM_ADMIN';
  if (!canBroadcast) {
    return (
      <div style={{ padding: 40, maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ background: '#FEE2E2', color: '#DC2626', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--adm-text)' }}>Access Restricted</h2>
        <p style={{ color: 'var(--adm-text-med)', fontSize: 14, lineHeight: 1.6 }}>
          Push Notification Broadcast is restricted to Super Admins and Platform Admins to protect users from accidental bulk messaging.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#EEF2FF', padding: 10, borderRadius: 12, color: '#4F46E5' }}>
            <Megaphone size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>
              Push Notification Broadcast Center
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--adm-text-med)' }}>
              Dispatch high-priority native push notifications via FCM to Android &amp; iOS devices in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="admin-card" style={{ marginBottom: 24, background: '#FAFAFA', border: '1px dashed #D4D4D8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={16} style={{ color: '#E8581C' }} />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717A' }}>
            Quick Announcement Templates
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#FFFFFF',
                border: '1px solid #E4E4E7',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4F46E5';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E4E4E7';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#18181B' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#71717A' }}>Target: {p.audience}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form + Mobile Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.95fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Compose Form */}
        <div className="admin-card">
          <form onSubmit={handleOpenConfirm}>
            {/* Target Audience */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 8 }}>
                Target Audience
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { key: 'ALL', label: 'All Users', sub: 'Every registered device', icon: Layers },
                  { key: 'SELLERS', label: 'Sellers Only', sub: 'Manufacturers & suppliers', icon: Smartphone },
                  { key: 'BUYERS', label: 'Buyers Only', sub: 'B2B sourcing buyers', icon: Users },
                ].map(({ key, label, sub, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTargetAudience(key)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 8,
                      border: targetAudience === key ? '2px solid #4F46E5' : '1px solid var(--adm-border)',
                      background: targetAudience === key ? '#EEF2FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} style={{ margin: '0 auto 6px', color: targetAudience === key ? '#4F46E5' : '#71717A' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: targetAudience === key ? '#4F46E5' : 'var(--adm-text)' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10, color: '#71717A', marginTop: 2 }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Title */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)' }}>
                  Notification Title *
                </label>
                <span style={{ fontSize: 11, color: title.length > 50 ? '#DC2626' : '#71717A' }}>
                  {title.length}/60
                </span>
              </div>
              <input
                type="text"
                className="admin-input"
                maxLength={65}
                placeholder="e.g. Scheduled System Upgrade at 2 AM"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 8, border: '1px solid var(--adm-border)' }}
                required
              />
            </div>

            {/* Notification Message Body */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)' }}>
                  Message Content *
                </label>
                <span style={{ fontSize: 11, color: body.length > 180 ? '#DC2626' : '#71717A' }}>
                  {body.length}/200
                </span>
              </div>
              <textarea
                className="admin-input"
                rows={4}
                maxLength={240}
                placeholder="Describe the update clearly and concisely so users understand the impact immediately..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 14, borderRadius: 8, border: '1px solid var(--adm-border)', resize: 'vertical' }}
                required
              />
            </div>

            {/* Action URL / Deep Link */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 6 }}>
                Action Link or Deep Link (Optional)
              </label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. https://play.google.com/store/apps/... or /seller-portal"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 8, border: '1px solid var(--adm-border)' }}
              />
              <div style={{ fontSize: 11, color: '#71717A', marginTop: 4 }}>
                When users tap the notification, the app will open this route or external URL.
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', marginBottom: 20, fontSize: 13 }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={sending || !title.trim() || !body.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: sending || !title.trim() || !body.trim() ? '#9CA3AF' : '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: sending || !title.trim() || !body.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(79, 70, 229, 0.25)',
                  transition: 'background 0.2s',
                }}
              >
                {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                Review &amp; Broadcast
              </button>
            </div>
          </form>
        </div>

        {/* Right: Realistic Device Preview & Delivery Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live Mobile Shade Preview */}
          <div className="admin-card" style={{ background: '#18181B', color: '#FFFFFF', borderRadius: 16, padding: 24, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid #27272A', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={16} style={{ color: '#A1A1AA' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#A1A1AA', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Device Notification Shade Preview
                </span>
              </div>
              <span style={{ fontSize: 11, background: '#27272A', padding: '2px 8px', borderRadius: 10, color: '#D4D4D8' }}>
                FCM Multicast
              </span>
            </div>

            {/* Android / iOS Notification Card */}
            <div style={{ background: '#27272A', borderRadius: 12, padding: 16, border: '1px solid #3F3F46' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: '#E8581C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#FFF' }}>
                    X
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#F4F4F5' }}>XINDIA</span>
                  <span style={{ fontSize: 11, color: '#71717A' }}>• just now</span>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                {title.trim() || 'Notification Title Preview'}
              </div>
              <div style={{ fontSize: 13, color: '#D4D4D8', lineHeight: 1.45, wordBreak: 'break-word' }}>
                {body.trim() || 'Notification message will appear here in the user device notification tray and lock screen.'}
              </div>

              {actionUrl.trim() && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#818CF8' }}>
                  <ExternalLink size={12} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {actionUrl}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#A1A1AA' }}>
              <Info size={14} />
              <span>Delivered via Firebase Cloud Messaging with high priority.</span>
            </div>
          </div>

          {/* Delivery Result Card */}
          {result && (
            <div className="admin-card" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <CheckCircle2 size={24} style={{ color: '#16A34A' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#166534' }}>
                    Broadcast Dispatched Successfully!
                  </h4>
                  <div style={{ fontSize: 12, color: '#15803D' }}>Dispatched at {result.timestamp}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #BBF7D0', marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>TARGET USERS</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{result.recipientUsers ?? 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>DELIVERED</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>{result.sentCount ?? 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>FAILED TOKENS</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: result.failureCount > 0 ? '#DC2626' : '#6B7280' }}>
                    {result.failureCount ?? 0}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
                {result.message}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Safety Modal */}
      {isConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>
                  Confirm Push Broadcast
                </h3>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  This action sends a direct mobile alert to real devices and cannot be undone.
                </div>
              </div>
            </div>

            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>AUDIENCE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                {targetAudience === 'ALL' ? 'All Registered Users' : targetAudience === 'SELLERS' ? 'Verified Sellers & Manufacturers' : 'B2B Buyers'}
              </div>

              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>TITLE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{title}</div>

              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>MESSAGE</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.45 }}>{body}</div>

              {actionUrl && (
                <>
                  <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>LINK</div>
                  <div style={{ fontSize: 12, color: '#4F46E5', wordBreak: 'break-all' }}>{actionUrl}</div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={sending}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={sending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#DC2626',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                }}
              >
                {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? 'Broadcasting...' : 'Yes, Dispatch Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
