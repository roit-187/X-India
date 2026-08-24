'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, ChevronDown, ChevronUp, CheckCircle, Clock, FileText, Globe, Save, Send, Eye, History, Users, AlertTriangle } from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

// ─── Document type config ─────────────────────────────────────────────────────
const DOC_TYPES = [
  {
    key: 'BUYER_PRIVACY',
    label: 'Privacy Policy',
    audience: 'All Users (Buyers)',
    description: 'Governs how user personal data is collected, stored, used, and shared.',
    color: '#2563EB',
  },
  {
    key: 'BUYER_TERMS',
    label: 'Terms & Conditions',
    audience: 'All Users (Buyers)',
    description: 'General platform usage rules, liability, dispute resolution.',
    color: '#059669',
  },
  {
    key: 'SELLER_TERMS',
    label: 'Seller Agreement',
    audience: 'Sellers / Manufacturers',
    description: 'Marketplace rules, listing obligations, commission, penalties.',
    color: '#D97706',
  },
  {
    key: 'SELLER_DPA',
    label: 'Data Processing Agreement',
    audience: 'Sellers / Manufacturers',
    description: 'DPDP Act mandated DPA for sellers who process buyer data.',
    color: '#7C3AED',
  },
];

const SEVERITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#EA580C',
  MEDIUM: '#D97706',
  LOW: '#64748B',
};

// ─── Simple Rich Text Toolbar buttons ────────────────────────────────────────
function RichToolbar({ onCmd }) {
  const btn = (label, cmd, arg) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onCmd(cmd, arg); }}
      title={label}
      style={{
        padding: '4px 8px',
        fontSize: 12,
        fontWeight: 600,
        border: '1px solid #E2E8F0',
        borderRadius: 4,
        background: '#fff',
        cursor: 'pointer',
        color: '#334155',
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 10px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRadius: '8px 8px 0 0' }}>
      {btn('B', 'bold')}
      {btn('I', 'italic')}
      {btn('U', 'underline')}
      {btn('H2', 'formatBlock', 'h2')}
      {btn('H3', 'formatBlock', 'h3')}
      {btn('• List', 'insertUnorderedList')}
      {btn('1. List', 'insertOrderedList')}
      {btn('— Rule', 'insertHorizontalRule')}
      {btn('Clear', 'removeFormat')}
    </div>
  );
}

// ─── ContentEditable Rich Text Editor ────────────────────────────────────────
function RichEditor({ value, onChange, placeholder = 'Start writing the legal document...' }) {
  const execCmd = (cmd, arg) => document.execCommand(cmd, false, arg || null);

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
      <RichToolbar onCmd={execCmd} />
      <div
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        style={{
          minHeight: 340,
          padding: '14px 16px',
          fontSize: 14,
          lineHeight: 1.7,
          color: '#1E293B',
          outline: 'none',
          overflowY: 'auto',
        }}
      />
    </div>
  );
}

// ─── Version badge ────────────────────────────────────────────────────────────
function VersionBadge({ version, status }) {
  const colors = { PUBLISHED: '#059669', DRAFT: '#D97706', ARCHIVED: '#94A3B8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontWeight: 700, color: '#1E293B', fontSize: 13 }}>v{version}</span>
      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: colors[status] || '#94A3B8', color: '#fff' }}>
        {status}
      </span>
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminLegalPage() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const [activeTab, setActiveTab] = useState('BUYER_PRIVACY');
  const [docs, setDocs] = useState({});         // { [type]: { current, history } }
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('en');       // 'en' | 'hi'
  const [draft, setDraft] = useState({
    contentEn: '',
    contentHi: '',
    changelogEn: '',
    changelogHi: '',
    effectiveDate: '',
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 4500);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, statsRes] = await Promise.all([
        fetch('/api/admin/legal/documents'),
        fetch('/api/admin/legal/consent-stats'),
      ]);
      const docsData = await docsRes.json();
      const statsData = await statsRes.json();

      if (docsData.success) {
        const grouped = {};
        DOC_TYPES.forEach(({ key }) => {
          const typeHistory = (docsData.documents || [])
            .filter((d) => d.type === key)
            .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
          grouped[key] = {
            current: typeHistory.find((d) => d.status === 'PUBLISHED') || null,
            draft: typeHistory.find((d) => d.status === 'DRAFT') || null,
            history: typeHistory,
          };
        });
        setDocs(grouped);

        // Pre-fill draft from existing draft or blank.
        const activeDraft = grouped[activeTab]?.draft;
        if (activeDraft) {
          setDraft({
            contentEn: activeDraft.contentEn || '',
            contentHi: activeDraft.contentHi || '',
            changelogEn: activeDraft.changelogEn || '',
            changelogHi: activeDraft.changelogHi || '',
            effectiveDate: activeDraft.effectiveDate
              ? new Date(activeDraft.effectiveDate).toISOString().slice(0, 10)
              : '',
            _id: activeDraft._id,
          });
        }
      }
      if (statsData.success) setStats(statsData.stats || {});
    } catch (err) {
      showAlert('error', 'Failed to load legal documents.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { if (loaded && isSuperAdmin) loadAll(); }, [loaded, isSuperAdmin, loadAll]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setHistoryOpen(false);
    setPreviewOpen(false);
  };

  const handleSaveDraft = async () => {
    if (!draft.contentEn.trim()) return showAlert('error', 'English content is required.');
    if (!draft.effectiveDate) return showAlert('error', 'Effective date is required.');
    setSaving(true);
    try {
      const isUpdate = !!draft._id;
      const url = isUpdate
        ? `/api/admin/legal/documents/${draft._id}`
        : '/api/admin/legal/documents';
      const method = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          contentEn: draft.contentEn,
          contentHi: draft.contentHi || null,
          changelogEn: draft.changelogEn,
          changelogHi: draft.changelogHi || null,
          effectiveDate: draft.effectiveDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', `Draft saved — v${data.document.version}`);
        setDraft((d) => ({ ...d, _id: data.document._id }));
        loadAll();
      } else {
        showAlert('error', data.message || 'Save failed.');
      }
    } catch {
      showAlert('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft._id) return showAlert('error', 'Save a draft first before publishing.');
    if (!window.confirm(
      `Publish this version of ${DOC_TYPES.find((d) => d.key === activeTab)?.label}?\n\nThis will archive the current published version and notify all users who need to re-accept the updated terms.`
    )) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/legal/documents/${draft._id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showAlert('success', data.message || 'Published successfully.');
        loadAll();
        setDraft({ contentEn: '', contentHi: '', changelogEn: '', changelogHi: '', effectiveDate: '' });
      } else {
        showAlert('error', data.message || 'Publish failed.');
      }
    } catch {
      showAlert('error', 'Network error.');
    } finally {
      setPublishing(false);
    }
  };

  if (!loaded) return null;
  if (!isSuperAdmin) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <Shield size={48} color="#DC2626" style={{ margin: '0 auto 16px' }} />
        <h2>Access Restricted</h2>
        <p style={{ color: '#64748B' }}>Only Super Admins can manage legal documents.</p>
      </div>
    );
  }

  const activeDocType = DOC_TYPES.find((d) => d.key === activeTab);
  const current = docs[activeTab]?.current;
  const typeStats = stats[activeTab];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Shield size={22} color="#2563EB" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Legal & Compliance</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
            Manage DPDP-compliant legal documents. Published changes trigger re-acceptance for all affected users.
          </p>
        </div>
      </div>

      {/* Alert */}
      {alertMsg.text && (
        <div style={{
          marginBottom: 16,
          padding: '10px 16px',
          borderRadius: 8,
          background: alertMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
          color: alertMsg.type === 'success' ? '#166534' : '#991B1B',
          fontSize: 13,
          fontWeight: 500,
        }}>
          {alertMsg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* ── Sidebar tabs ── */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            {DOC_TYPES.map((dt) => {
              const isActive = activeTab === dt.key;
              const hasCurrent = !!docs[dt.key]?.current;
              return (
                <button
                  key={dt.key}
                  onClick={() => handleTabChange(dt.key)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    border: 'none',
                    background: isActive ? '#EFF6FF' : 'transparent',
                    borderLeft: isActive ? `3px solid ${dt.color}` : '3px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? dt.color : '#1E293B' }}>{dt.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dt.audience}</div>
                  </div>
                  {hasCurrent
                    ? <CheckCircle size={14} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    : <Clock size={14} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Consent stats card */}
          {typeStats && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={13} /> Consent Stats
              </div>
              <div style={{ fontSize: 12, color: '#1E293B', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: '#059669', fontSize: 16 }}>{typeStats.onCurrent || 0}</span>
                <span style={{ color: '#64748B', marginLeft: 4 }}>on current v{typeStats.currentVersion}</span>
              </div>
              {typeStats.onOlder > 0 && (
                <div style={{ fontSize: 12, color: '#D97706' }}>
                  ⚠ {typeStats.onOlder} users on older versions
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Main editor area ── */}
        <div>
          {/* Current published version */}
          {current && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={16} color="#059669" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Active Published Version</span>
                </div>
                <VersionBadge version={current.version} status={current.status} />
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                <span>Effective: {new Date(current.effectiveDate).toLocaleDateString('en-IN')}</span>
                <span>Published: {new Date(current.publishedAt).toLocaleDateString('en-IN')}</span>
              </div>
              {current.changelogEn && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#92400E' }}>
                  <strong>What changed:</strong> {current.changelogEn}
                </div>
              )}
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                style={{ marginTop: 10, fontSize: 12, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Eye size={13} /> {previewOpen ? 'Hide' : 'Preview'} current content
                {previewOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {previewOpen && (
                <div
                  style={{ marginTop: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, fontSize: 13, lineHeight: 1.8, maxHeight: 300, overflowY: 'auto', border: '1px solid #E2E8F0' }}
                  dangerouslySetInnerHTML={{ __html: current.contentEn }}
                />
              )}
            </div>
          )}

          {/* Draft editor */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: activeDocType?.color }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  {draft._id ? 'Edit Draft' : 'New Draft'} — {activeDocType?.label}
                </span>
              </div>
              {/* Language toggle */}
              <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                {['en', 'hi'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    style={{
                      padding: '5px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      background: lang === l ? '#2563EB' : '#fff',
                      color: lang === l ? '#fff' : '#64748B',
                      cursor: 'pointer',
                    }}
                  >
                    {l === 'en' ? '🇬🇧 EN' : '🇮🇳 HI'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
                {lang === 'en' ? 'Content (English) *' : 'Content (Hindi) — Optional'}
              </label>
              <RichEditor
                value={lang === 'en' ? draft.contentEn : (draft.contentHi || '')}
                onChange={(html) =>
                  setDraft((d) => lang === 'en' ? { ...d, contentEn: html } : { ...d, contentHi: html })
                }
                placeholder={
                  lang === 'en'
                    ? 'Write the legal document in English...'
                    : 'यहाँ हिंदी में लिखें... (वैकल्पिक)'
                }
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
                {lang === 'en' ? 'What Changed in This Version (English)' : 'इस संस्करण में क्या बदला (हिंदी)'}
                <span style={{ fontWeight: 400, marginLeft: 6 }}>(shown to users when they must re-accept)</span>
              </label>
              <textarea
                className="admin-input"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder={lang === 'en'
                  ? 'e.g. "Updated data retention policy. Added new section on third-party sharing."'
                  : 'e.g. "डेटा अवधारण नीति अपडेट की गई।"'
                }
                value={lang === 'en' ? draft.changelogEn : (draft.changelogHi || '')}
                onChange={(e) =>
                  setDraft((d) => lang === 'en' ? { ...d, changelogEn: e.target.value } : { ...d, changelogHi: e.target.value })
                }
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>
                Effective Date *
              </label>
              <input
                type="date"
                className="admin-input"
                style={{ width: 200 }}
                value={draft.effectiveDate}
                onChange={(e) => setDraft((d) => ({ ...d, effectiveDate: e.target.value }))}
                min={new Date().toISOString().slice(0, 10)}
              />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>
                The date this version comes into legal effect. Can be today or a future date.
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="admin-btn"
                onClick={handleSaveDraft}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !draft._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: draft._id ? '#059669' : '#E2E8F0',
                  color: draft._id ? '#fff' : '#94A3B8',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: draft._id ? 'pointer' : 'not-allowed',
                }}
              >
                <Send size={15} />
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>

            {!draft._id && (
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#94A3B8' }}>
                Save a draft first. Then you can publish it.
              </p>
            )}
          </div>

          {/* Version history */}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              style={{ fontSize: 13, fontWeight: 600, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <History size={15} />
              Version History
              {historyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {historyOpen && (
              <div style={{ marginTop: 10, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                {(docs[activeTab]?.history || []).length === 0 ? (
                  <div style={{ padding: 16, color: '#94A3B8', fontSize: 13 }}>No versions yet.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        {['Version', 'Status', 'Effective Date', 'Published By', 'Published At'].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 12, borderBottom: '1px solid #E2E8F0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {docs[activeTab].history.map((doc) => (
                        <tr key={doc._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>v{doc.version}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                              background: doc.status === 'PUBLISHED' ? '#DCFCE7' : doc.status === 'DRAFT' ? '#FEF9C3' : '#F1F5F9',
                              color: doc.status === 'PUBLISHED' ? '#166534' : doc.status === 'DRAFT' ? '#854D0E' : '#64748B',
                            }}>
                              {doc.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>{new Date(doc.effectiveDate).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>{doc.publishedBy?.username || '—'}</td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>{doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
