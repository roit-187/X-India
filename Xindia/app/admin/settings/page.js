'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Server, Globe, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Activity, Cpu, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function AdminSettingsPage() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const [settings, setSettings] = useState({
    serverApiUrl: 'https://ascend-ds0q.onrender.com',
    websiteUrl: 'https://x-india.vercel.app',
    isMaintenanceMode: false,
    isGstVerificationEnabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Live Ping Test State
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null); // { success: true/false, latency: 120, message: '' }

  // Load Settings from API
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings/system');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings({
          serverApiUrl: data.settings.serverApiUrl || 'https://ascend-ds0q.onrender.com',
          websiteUrl: data.settings.websiteUrl || 'https://x-india.vercel.app',
          isMaintenanceMode: Boolean(data.settings.isMaintenanceMode),
          isGstVerificationEnabled: Boolean(data.settings.isGstVerificationEnabled),
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
                    placeholder="https://x-india.vercel.app"
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
