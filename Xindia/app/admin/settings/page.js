'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Server, Globe, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Activity, Cpu, ArrowRight, ExternalLink, AlertTriangle, Mail, Phone, MessageSquare, Smartphone, Zap, PhoneCall, Flame, Trash2, Plus, Share2 } from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function AdminSettingsPage() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const [settings, setSettings] = useState({
    serverApiUrl: 'https://api.xindia.live',
    websiteUrl: 'https://xindia.live',
    isMaintenanceMode: false,
    isGstVerificationEnabled: false,
    supportEmail: 'support@xindia.live',
    supportPhone: '+91 8860260878',
    primaryOtpProvider: 'WHATSAPP',
    emailProvider: 'RESEND',
    isFirebasePhoneAuthEnabled: true,
    socialLinks: [],
    appVersionPolicy: {
      minSupportedVersion: '1.0.0',
      latestVersion: '1.0.0',
      forceUpdateTitle: 'Update Required',
      forceUpdateMessage: 'A critical update is required to continue using XINDIA. Please update from the Google Play Store.',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.xindia.marketplace',
    },
  });

  // State for adding a new social link
  const [newPlatform, setNewPlatform] = useState('twitter');
  const [newUrl, setNewUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Live Ping Test State
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null); // { success: true/false, latency: 120, message: '' }

  // Social Links Management Handlers
  const handleAddSocialLink = () => {
    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) return;
    const exists = settings.socialLinks?.some((l) => l.platform === newPlatform);
    if (exists) {
      alert(`A profile for ${newPlatform} is already added. You can update its URL in the list below.`);
      return;
    }
    const updated = [
      ...(settings.socialLinks || []),
      { platform: newPlatform, url: trimmedUrl, isActive: true },
    ];
    setSettings({ ...settings, socialLinks: updated });
    setNewUrl('');
  };

  const handleUpdateSocialUrl = (index, url) => {
    const updated = [...(settings.socialLinks || [])];
    updated[index] = { ...updated[index], url };
    setSettings({ ...settings, socialLinks: updated });
  };

  const handleToggleSocialActive = (index) => {
    const updated = [...(settings.socialLinks || [])];
    updated[index] = { ...updated[index], isActive: !updated[index].isActive };
    setSettings({ ...settings, socialLinks: updated });
  };

  const handleDeleteSocialLink = (index) => {
    const updated = (settings.socialLinks || []).filter((_, i) => i !== index);
    setSettings({ ...settings, socialLinks: updated });
  };

  // Load Settings from API
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings/system');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings({
          serverApiUrl: data.settings.serverApiUrl || 'https://api.xindia.live',
          websiteUrl: data.settings.websiteUrl || 'https://xindia.live',
          isMaintenanceMode: Boolean(data.settings.isMaintenanceMode),
          isGstVerificationEnabled: Boolean(data.settings.isGstVerificationEnabled),
          supportEmail: data.settings.supportEmail || 'support@xindia.live',
          supportPhone: data.settings.supportPhone || '+91 8860260878',
          primaryOtpProvider: data.settings.primaryOtpProvider || 'WHATSAPP',
          emailProvider: data.settings.emailProvider || 'RESEND',
          isFirebasePhoneAuthEnabled: data.settings.isFirebasePhoneAuthEnabled !== false,
          socialLinks: Array.isArray(data.settings.socialLinks) ? data.settings.socialLinks : [],
          appVersionPolicy: data.settings.appVersionPolicy || {
            minSupportedVersion: '1.0.0',
            latestVersion: '1.0.0',
            forceUpdateTitle: 'Update Required',
            forceUpdateMessage: 'A critical update is required to continue using XINDIA. Please update from the Google Play Store.',
            playStoreUrl: 'https://play.google.com/store/apps/details?id=com.xindia.marketplace',
          },
        });
      }
    } catch (err) {
      console.error('Error loading system settings:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load system settings from server' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loaded && !isSuperAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 32 }} className="admin-card">
        <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#0F172A' }}>Access Restricted</h2>
        <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>
          System & server configuration is strictly restricted to Super Administrators.
        </p>
        <Link href="/admin/dashboard" className="admin-btn admin-btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Ping Test Function
  const handleTestConnection = async () => {
    setPinging(true);
    setPingResult(null);
    const start = performance.now();
    try {
      const targetUrl = settings.serverApiUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${targetUrl}/api/health`, { method: 'GET', mode: 'cors' });
      const duration = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setPingResult({
          success: true,
          latency: duration,
          message: data.message || 'Server is active and healthy',
        });
      } else {
        setPingResult({
          success: false,
          latency: duration,
          message: `Server returned HTTP status ${res.status}`,
        });
      }
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      setPingResult({
        success: false,
        latency: duration,
        message: err.message || 'Failed to reach server (CORS / Network error)',
      });
    } finally {
      setPinging(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'System & Server settings updated successfully!' });
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to update settings' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--adm-text)', margin: '0 0 4px' }}>
            System & Server Configuration
          </h1>
          <p style={{ color: 'var(--adm-text-med)', margin: 0, fontSize: 14 }}>
            Manage backend routing, API endpoints, website domains, and platform maintenance status.
          </p>
        </div>
        <button
          onClick={loadSettings}
          className="admin-btn admin-btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status Alerts */}
      {statusMsg.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--adm-radius-sm)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            background: statusMsg.type === 'success' ? 'var(--adm-green-bg)' : 'var(--adm-red-bg)',
            color: statusMsg.type === 'success' ? '#047857' : '#B91C1C',
            border: `1px solid ${statusMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          }}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {statusMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--adm-text-med)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          Loading system settings...
        </div>
      ) : (
        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Server & API Routing Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#FFF7ED', padding: 8, borderRadius: 8, color: 'var(--adm-primary)' }}>
                  <Server size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                    Backend API Server URL
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)' }}>
                    Active REST API server handling authentication, portfolios, chats, and mobile app traffic.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                  Backend Server Address (HTTPS)
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="url"
                    className="admin-input"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 14 }}
                    value={settings.serverApiUrl}
                    onChange={(e) => setSettings({ ...settings, serverApiUrl: e.target.value })}
                    placeholder="https://ascend-ds0q.onrender.com"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    className="admin-btn admin-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                    disabled={pinging || !settings.serverApiUrl}
                  >
                    <Activity size={15} className={pinging ? 'animate-spin' : ''} />
                    {pinging ? 'Pinging...' : 'Test Connection'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--adm-text-light)', marginTop: 6 }}>
                  Current Render instance: <code style={{ color: 'var(--adm-primary)' }}>https://ascend-ds0q.onrender.com</code>.
                  Update this anytime to point to your new cloud server without releasing a mobile app update.
                </div>
              </div>

              {/* Ping Result Display */}
              {pingResult && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--adm-radius-sm)',
                    background: pingResult.success ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${pingResult.success ? '#BBF7D0' : '#FECACA'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: pingResult.success ? '#16A34A' : '#DC2626',
                      }}
                    />
                    <span style={{ fontWeight: 600, color: pingResult.success ? '#166534' : '#991B1B' }}>
                      {pingResult.success ? 'Server Online' : 'Connection Failed'}:
                    </span>
                    <span style={{ color: pingResult.success ? '#15803D' : '#B91C1C' }}>{pingResult.message}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: pingResult.success ? '#166534' : '#991B1B' }}>
                    {pingResult.latency}ms
                  </span>
                </div>
              )}
            </div>

            {/* Website & Domain Configuration */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#EFF6FF', padding: 8, borderRadius: 8, color: '#2563EB' }}>
                  <Globe size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                    Website & Storefront URL
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)' }}>
                    Production storefront hosting seller portfolios, landing pages, and QR code redirects.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                  Website URL / Custom Domain
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="url"
                    className="admin-input"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 14 }}
                    value={settings.websiteUrl}
                    onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
                    placeholder="https://xindia.live"
                    required
                  />
                  <a
                    href={settings.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                  >
                    <ExternalLink size={15} />
                    Open
                  </a>
                </div>
                <div style={{ fontSize: 12, color: 'var(--adm-text-light)', marginTop: 6 }}>
                  Default Vercel deployment: <code style={{ color: '#2563EB' }}>https://x-india.vercel.app</code>. When you connect your official domain (e.g. <code style={{ color: '#2563EB' }}>https://xindia.in</code>), change it here to update all generated seller QR codes and storefront links.
                </div>
              </div>
            </div>

            {/* Platform Support & Contact Info Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#FEF3C7', padding: 8, borderRadius: 8, color: '#D97706' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                    Platform Support & Reviewer Contact Info
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)' }}>
                    Official contact channels displayed on public /contact page, invoices, and Google Play Console declarations.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                    Official Support Email
                  </label>
                  <input
                    type="email"
                    className="admin-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 14 }}
                    value={settings.supportEmail || ''}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="support@xindia.live"
                    required
                  />
                  <div style={{ fontSize: 12, color: 'var(--adm-text-light)', marginTop: 4 }}>
                    Receives buyer/seller queries and Google Play reviewer messages.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                    Helpline & WhatsApp Number
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 14 }}
                    value={settings.supportPhone || ''}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    placeholder="+91 8860260878"
                    required
                  />
                  <div style={{ fontSize: 12, color: 'var(--adm-text-light)', marginTop: 4 }}>
                    Official helpline number and direct WhatsApp chat target.
                  </div>
                </div>
              </div>
            </div>

            {/* Official Social Media Channels Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#EDE9FE', padding: 8, borderRadius: 8, color: '#7C3AED' }}>
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                    Official Social Media Channels & Profiles
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)' }}>
                    Add, edit, or delete platform handles. Active channels automatically appear in the website footer.
                  </p>
                </div>
              </div>

              {/* Add New Handle Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  background: '#F8FAFC',
                  padding: '14px 16px',
                  borderRadius: 'var(--adm-radius-sm)',
                  border: '1px solid var(--adm-border)',
                  marginBottom: 18,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 160 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text-med)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Platform
                  </label>
                  <select
                    className="admin-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)' }}
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                  >
                    <option value="twitter">X / Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                    <option value="whatsapp">WhatsApp Channel</option>
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text-med)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Profile / Channel URL
                  </label>
                  <input
                    type="url"
                    className="admin-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)' }}
                    placeholder={`https://${newPlatform === 'twitter' ? 'x.com' : newPlatform === 'linkedin' ? 'linkedin.com/company' : newPlatform}.com/...`}
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSocialLink();
                      }
                    }}
                  />
                </div>

                <div style={{ alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleAddSocialLink}
                    className="admin-btn admin-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600 }}
                  >
                    <Plus size={15} />
                    Add Channel
                  </button>
                </div>
              </div>

              {/* Active Channels List */}
              {(!settings.socialLinks || settings.socialLinks.length === 0) ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--adm-text-med)', fontSize: 13, background: '#F9FAFB', borderRadius: 'var(--adm-radius-sm)', border: '1px dashed var(--adm-border)' }}>
                  No social media handles added yet. Choose a platform above and enter your official profile URL.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {settings.socialLinks.map((item, idx) => {
                    const platformLabels = {
                      twitter: 'X / Twitter',
                      linkedin: 'LinkedIn',
                      instagram: 'Instagram',
                      facebook: 'Facebook',
                      youtube: 'YouTube',
                      whatsapp: 'WhatsApp',
                    };
                    const platformColors = {
                      twitter: '#0F172A',
                      linkedin: '#0A66C2',
                      instagram: '#E1306C',
                      facebook: '#1877F2',
                      youtube: '#FF0000',
                      whatsapp: '#25D366',
                    };

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 'var(--adm-radius-sm)',
                          border: '1px solid var(--adm-border)',
                          background: item.isActive ? '#FFFFFF' : '#F8FAFC',
                          opacity: item.isActive ? 1 : 0.65,
                        }}
                      >
                        {/* Platform Badge */}
                        <div
                          style={{
                            minWidth: 110,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 700,
                            fontSize: 12,
                            color: platformColors[item.platform] || 'var(--adm-text)',
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: platformColors[item.platform] || '#94A3B8' }} />
                          {platformLabels[item.platform] || item.platform}
                        </div>

                        {/* URL Input */}
                        <input
                          type="url"
                          className="admin-input"
                          style={{ flex: 1, padding: '6px 12px', fontSize: 13, borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)' }}
                          value={item.url}
                          onChange={(e) => handleUpdateSocialUrl(idx, e.target.value)}
                        />

                        {/* Toggle Active */}
                        <button
                          type="button"
                          onClick={() => handleToggleSocialActive(idx)}
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 12,
                            border: 'none',
                            cursor: 'pointer',
                            background: item.isActive ? '#DCFCE7' : '#F1F5F9',
                            color: item.isActive ? '#15803D' : '#64748B',
                          }}
                        >
                          {item.isActive ? 'Active' : 'Disabled'}
                        </button>

                        {/* External Link */}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Link"
                          style={{ color: 'var(--adm-text-med)', display: 'flex', alignItems: 'center', padding: 4 }}
                        >
                          <ExternalLink size={15} />
                        </a>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSocialLink(idx)}
                          title="Delete Handle"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#EF4444',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 4,
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Maintenance Mode & Safety Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: settings.isMaintenanceMode ? '#FEE2E2' : '#F1F5F9', padding: 8, borderRadius: 8, color: settings.isMaintenanceMode ? '#DC2626' : 'var(--adm-text-med)' }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                      Platform Maintenance Mode
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)' }}>
                      When enabled, clients receive a maintenance notice during database migrations or major upgrades.
                    </p>
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.isMaintenanceMode}
                    onChange={(e) => setSettings({ ...settings, isMaintenanceMode: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.isMaintenanceMode ? 'var(--adm-red)' : '#CBD5E1',
                      transition: '0.2s',
                      borderRadius: 26,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        content: '',
                        height: 20,
                        width: 20,
                        left: settings.isMaintenanceMode ? 24 : 3,
                        bottom: 3,
                        backgroundColor: '#FFFFFF',
                        transition: '0.2s',
                        borderRadius: '50%',
                      }}
                    />
                  </span>
                </label>
              </div>
            </div>

            {/* Mobile App Version Policy & Force Update Control Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#FEF3C7', padding: 8, borderRadius: 8, color: '#D97706' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                    Mobile App Version Policy &amp; Force Update Control
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)' }}>
                    Control app update enforcement on Android &amp; iOS. Devices running a version below the Minimum Supported Version are hard-locked on launch until updated.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                    Minimum Supported Version (Hard Lock)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 14, fontWeight: 700, color: '#DC2626' }}
                    value={settings.appVersionPolicy?.minSupportedVersion || '1.0.0'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        appVersionPolicy: { ...settings.appVersionPolicy, minSupportedVersion: e.target.value },
                      })
                    }
                    placeholder="e.g. 1.0.0"
                    required
                  />
                  <div style={{ fontSize: 12, color: 'var(--adm-text-light)', marginTop: 4 }}>
                    Any app running below this version will be blocked from opening.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                    Latest Available Version (Store Version)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 14, fontWeight: 700, color: '#16A34A' }}
                    value={settings.appVersionPolicy?.latestVersion || '1.0.0'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        appVersionPolicy: { ...settings.appVersionPolicy, latestVersion: e.target.value },
                      })
                    }
                    placeholder="e.g. 1.1.0"
                    required
                  />
                  <div style={{ fontSize: 12, color: 'var(--adm-text-light)', marginTop: 4 }}>
                    Current production release version on the Google Play Store.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                  Update Dialog Title
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 14 }}
                  value={settings.appVersionPolicy?.forceUpdateTitle || 'Update Required'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      appVersionPolicy: { ...settings.appVersionPolicy, forceUpdateTitle: e.target.value },
                    })
                  }
                  placeholder="Update Required"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                  Update Required Lockout Message
                </label>
                <textarea
                  className="admin-input"
                  rows={2}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 13 }}
                  value={settings.appVersionPolicy?.forceUpdateMessage || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      appVersionPolicy: { ...settings.appVersionPolicy, forceUpdateMessage: e.target.value },
                    })
                  }
                  placeholder="A critical update is required to continue using XINDIA. Please update from the Google Play Store."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>
                  Google Play Store URL
                </label>
                <input
                  type="url"
                  className="admin-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-sm)', border: '1px solid var(--adm-border)', fontSize: 13 }}
                  value={settings.appVersionPolicy?.playStoreUrl || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      appVersionPolicy: { ...settings.appVersionPolicy, playStoreUrl: e.target.value },
                    })
                  }
                  placeholder="https://play.google.com/store/apps/details?id=com.xindia.marketplace"
                />
              </div>
            </div>

            {/* GSTIN Verification Switch Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: settings.isGstVerificationEnabled ? '#DCFCE7' : '#F1F5F9', padding: 8, borderRadius: 8, color: settings.isGstVerificationEnabled ? '#16A34A' : 'var(--adm-text-med)' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                        Enforce GSTIN Verification
                      </h3>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: settings.isGstVerificationEnabled ? '#DCFCE7' : '#F1F5F9',
                          color: settings.isGstVerificationEnabled ? '#15803D' : '#64748B',
                        }}
                      >
                        {settings.isGstVerificationEnabled ? 'ACTIVE / ENFORCED' : 'BYPASS / DISABLED'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)', marginTop: 2 }}>
                      When enabled, the backend strictly verifies GSTIN structure & Luhn mod-36 check digit during seller onboarding and profile updates. When disabled, sellers can enter GSTIN without blocking registration.
                    </p>
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.isGstVerificationEnabled}
                    onChange={(e) => setSettings({ ...settings, isGstVerificationEnabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.isGstVerificationEnabled ? '#16A34A' : '#CBD5E1',
                      transition: '0.2s',
                      borderRadius: 26,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        content: '',
                        height: 20,
                        width: 20,
                        left: settings.isGstVerificationEnabled ? 24 : 3,
                        bottom: 3,
                        backgroundColor: '#FFFFFF',
                        transition: '0.2s',
                        borderRadius: '50%',
                      }}
                    />
                  </span>
                </label>
              </div>
            </div>

            {/* Authentication & Phone OTP Gateway Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#EFF6FF', padding: 8, borderRadius: 8, color: '#2563EB' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                    Authentication & Phone OTP Gateway
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)' }}>
                    Switch the active delivery provider between Meta WhatsApp and Firebase SMS anytime. Voice OTP remains active as a user fallback.
                  </p>
                </div>
              </div>

              {/* Provider Radio Selector Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* WhatsApp Option */}
                <div
                  onClick={() => setSettings({ ...settings, primaryOtpProvider: 'WHATSAPP' })}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--adm-radius-sm)',
                    border: settings.primaryOtpProvider === 'WHATSAPP' ? '2px solid #25D366' : '1px solid var(--adm-border)',
                    background: settings.primaryOtpProvider === 'WHATSAPP' ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#DCFCE7', padding: 6, borderRadius: 6, color: '#15803D' }}>
                        <MessageSquare size={18} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--adm-text)' }}>
                        Meta WhatsApp Cloud
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: '#DCFCE7',
                        color: '#15803D',
                        letterSpacing: 0.5,
                      }}
                    >
                      ~₹0.11 / OTP
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text-med)', lineHeight: 1.5 }}>
                    Instant WhatsApp OTP delivered via Meta Business API. Best conversion, zero DLT carrier regulation issues.
                  </p>
                  {settings.primaryOtpProvider === 'WHATSAPP' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#16A34A' }}>
                      <CheckCircle2 size={13} /> ACTIVE PRIMARY GATEWAY
                    </div>
                  )}
                </div>

                {/* Firebase Option */}
                <div
                  onClick={() => setSettings({ ...settings, primaryOtpProvider: 'FIREBASE' })}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--adm-radius-sm)',
                    border: settings.primaryOtpProvider === 'FIREBASE' ? '2px solid #F5820D' : '1px solid var(--adm-border)',
                    background: settings.primaryOtpProvider === 'FIREBASE' ? '#FFFBEB' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#FEF3C7', padding: 6, borderRadius: 6, color: '#D97706' }}>
                        <Flame size={18} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--adm-text)' }}>
                        Firebase Phone Auth (SMS)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: '#FEF3C7',
                        color: '#B45309',
                        letterSpacing: 0.5,
                      }}
                    >
                      ~₹6.00 / SMS
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text-med)', lineHeight: 1.5 }}>
                    Native cellular SMS OTP via Google Cloud Identity Platform. Zero DLT registration, billed to Firebase Blaze.
                  </p>
                  {settings.primaryOtpProvider === 'FIREBASE' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#D97706' }}>
                      <CheckCircle2 size={13} /> ACTIVE PRIMARY GATEWAY
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Switch: Firebase as Backup */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--adm-radius-sm)',
                  background: '#F8FAFC',
                  border: '1px solid var(--adm-border)',
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--adm-text)' }}>
                    Allow Firebase SMS as Dynamic Backup
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-light)' }}>
                    When WhatsApp is the primary gateway, permit users to fall back to Firebase SMS if WhatsApp fails.
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.isFirebasePhoneAuthEnabled}
                    onChange={(e) => setSettings({ ...settings, isFirebasePhoneAuthEnabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.isFirebasePhoneAuthEnabled ? '#2563EB' : '#CBD5E1',
                      transition: '0.2s',
                      borderRadius: 24,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        content: '',
                        height: 18,
                        width: 18,
                        left: settings.isFirebasePhoneAuthEnabled ? 22 : 3,
                        bottom: 3,
                        backgroundColor: '#FFFFFF',
                        transition: '0.2s',
                        borderRadius: '50%',
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Voice Fallback Notice */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--adm-radius-sm)',
                  background: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  fontSize: 12,
                  color: '#1E40AF',
                }}
              >
                <PhoneCall size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>
                  <strong>2Factor Voice Call Safety Net:</strong> Automated phone call OTP is permanently enabled as an on-demand button (<em>"Try Voice Call"</em>) for all mobile users. If WhatsApp or SMS are delayed, users can always receive their code via telephone call (~₹0.20 / call).
                </span>
              </div>
            </div>

            {/* Transactional Email & OTP Gateway Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#F5F3FF', padding: 8, borderRadius: 8, color: '#7C3AED' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>
                    Transactional Email & OTP Gateway
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--adm-text-med)' }}>
                    Switch the active delivery provider for registration OTPs and B2B invoices. If the selected provider is unavailable, the server automatically fails over to the next candidate.
                  </p>
                </div>
              </div>

              {/* Email Provider Radio Selector Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
                {/* Resend Option */}
                <div
                  onClick={() => setSettings({ ...settings, emailProvider: 'RESEND' })}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--adm-radius-sm)',
                    border: settings.emailProvider === 'RESEND' ? '2px solid #111827' : '1px solid var(--adm-border)',
                    background: settings.emailProvider === 'RESEND' ? '#F9FAFB' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#F3F4F6', padding: 6, borderRadius: 6, color: '#111827' }}>
                        <Zap size={18} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--adm-text)' }}>
                        Resend
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        letterSpacing: 0.5,
                      }}
                    >
                      RECOMMENDED
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text-med)', lineHeight: 1.5 }}>
                    Instant sub-second delivery (~1-2s). 3,000 free emails/month. Zero queue throttling. Optimized specifically for transactional auth OTPs.
                  </p>
                  {settings.emailProvider === 'RESEND' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#111827' }}>
                      <CheckCircle2 size={13} /> ACTIVE EMAIL GATEWAY
                    </div>
                  )}
                </div>

                {/* Brevo Option */}
                <div
                  onClick={() => setSettings({ ...settings, emailProvider: 'BREVO' })}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--adm-radius-sm)',
                    border: settings.emailProvider === 'BREVO' ? '2px solid #0D9488' : '1px solid var(--adm-border)',
                    background: settings.emailProvider === 'BREVO' ? '#F0FDFA' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#CCFBF1', padding: 6, borderRadius: 6, color: '#0F766E' }}>
                        <Mail size={18} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--adm-text)' }}>
                        Brevo (Sendinblue)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: '#CCFBF1',
                        color: '#0F766E',
                        letterSpacing: 0.5,
                      }}
                    >
                      300 / DAY FREE
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text-med)', lineHeight: 1.5 }}>
                    Cloud REST API via Port 443. Free plan queues on shared IP relay with ~20 min delivery pacing. Fast-track with Starter tier.
                  </p>
                  {settings.emailProvider === 'BREVO' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#0D9488' }}>
                      <CheckCircle2 size={13} /> ACTIVE EMAIL GATEWAY
                    </div>
                  )}
                </div>

                {/* AWS SES Option */}
                <div
                  onClick={() => setSettings({ ...settings, emailProvider: 'AWS_SES' })}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--adm-radius-sm)',
                    border: settings.emailProvider === 'AWS_SES' ? '2px solid #F59E0B' : '1px solid var(--adm-border)',
                    background: settings.emailProvider === 'AWS_SES' ? '#FFFBEB' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#FEF3C7', padding: 6, borderRadius: 6, color: '#D97706' }}>
                        <Server size={18} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--adm-text)' }}>
                        Amazon SES
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: '#FEF3C7',
                        color: '#B45309',
                        letterSpacing: 0.5,
                      }}
                    >
                      ~$0.10 / 1K
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text-med)', lineHeight: 1.5 }}>
                    Enterprise scale via AWS SDK v3. Sub-second global delivery. Lowest industry operating cost for high-volume apps.
                  </p>
                  {settings.emailProvider === 'AWS_SES' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#D97706' }}>
                      <CheckCircle2 size={13} /> ACTIVE EMAIL GATEWAY
                    </div>
                  )}
                </div>
              </div>

              {/* Automatic Failover Notice */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--adm-radius-sm)',
                  background: '#F5F3FF',
                  border: '1px solid #DDD6FE',
                  fontSize: 12,
                  color: '#5B21B6',
                }}
              >
                <Zap size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>
                  <strong>Zero-Downtime Smart Fallback:</strong> If the primary provider encounters an outage or quota limit, the backend automatically fails over to any other configured email service in real-time, preventing user signup blocks.
                </span>
              </div>
            </div>

            {/* Cloudflare & Zero Downtime Guide Box */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px dashed var(--adm-border)',
                borderRadius: 'var(--adm-radius)',
                padding: 18,
                fontSize: 13,
                color: 'var(--adm-text-med)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--adm-text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Cpu size={16} color="var(--adm-primary)" />
                Zero-Downtime Infrastructure Architecture:
              </div>
              <div>
                1. <strong>Mobile App Traffic:</strong> Points to the Vercel URL / dynamic config router.
                <br />
                2. <strong>Server Migration:</strong> When moving to a new cloud server (AWS, GCP, DigitalOcean), simply paste the new HTTPS URL into the <strong>Backend Server Address</strong> field above and click Save.
                <br />
                3. <strong>Instant Switch:</strong> All mobile devices and web buyers immediately connect to the new server with <strong>zero app updates required on Google Play Store</strong>.
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700 }}
                disabled={saving}
              >
                {saving ? 'Saving Settings...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
