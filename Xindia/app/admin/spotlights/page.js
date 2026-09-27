'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { Sparkles, Search, Trash2, Power, Plus, RefreshCw, X, ShieldAlert, AlertTriangle, ArrowUpDown, Tag, Flame, Image as ImageIcon } from 'lucide-react';

function SpotlightContent() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const searchParams = useSearchParams();

  const [campaigns, setCampaigns] = useState([]);
  const [counts, setCounts] = useState({ activeKeywordPins: 0, activeTrendingBoosts: 0, activeExploreBanners: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | KEYWORD_PIN | TRENDING_BOOST | EXPLORE_BANNER
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | expired
  const [search, setSearch] = useState('');

  // Modals & Action States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Create Form State
  const [entityQuery, setEntityQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');
  const [entityResults, setEntityResults] = useState([]);
  const [entitySearching, setEntitySearching] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const [formType, setFormType] = useState('KEYWORD_PIN');
  const [formTitle, setFormTitle] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formSlot, setFormSlot] = useState(1);
  const [formDurationDays, setFormDurationDays] = useState(7);
  const [formHeadline, setFormHeadline] = useState('');
  const [formSubHeadline, setFormSubHeadline] = useState('');
  const [formCustomImage, setFormCustomImage] = useState('');
  const [formInvestment, setFormInvestment] = useState(25000);
  const [formProfitEstimate, setFormProfitEstimate] = useState('30% - 40%');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (activeTab !== 'ALL') params.set('type', activeTab);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/spotlight?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCampaigns(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.counts) setCounts(data.counts);
      } else {
        showToast(data.message || 'Failed to load campaigns', 'error');
      }
    } catch (err) {
      console.error('Error fetching spotlight campaigns:', err);
      showToast('Network error fetching campaigns', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, statusFilter, search]);

  useEffect(() => {
    if (loaded) {
      fetchCampaigns();
    }
  }, [loaded, fetchCampaigns]);

  // Handle incoming shortcut params (e.g. from Products or Manufacturers table)
  useEffect(() => {
    const promoteType = searchParams.get('promoteType');
    const promoteId = searchParams.get('promoteId');
    if (promoteType && promoteId) {
      fetch(`/api/admin/spotlight/search-entities?q=${promoteId}&entityType=${promoteType}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.results?.[0]) {
            handleSelectEntity(data.results[0]);
            setCreateModalOpen(true);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  // Entity Search for Modal Autocomplete
  useEffect(() => {
    if (!createModalOpen || entityQuery.trim().length < 2) {
      setEntityResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setEntitySearching(true);
        const res = await fetch(`/api/admin/spotlight/search-entities?q=${encodeURIComponent(entityQuery.trim())}&entityType=${entityTypeFilter}`);
        const data = await res.json();
        if (data.success) {
          setEntityResults(data.results || []);
        }
      } catch (e) {
        console.error('Entity search error:', e);
      } finally {
        setEntitySearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [entityQuery, entityTypeFilter, createModalOpen]);

  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
    if (!formTitle) {
      setFormTitle(`${entity.title} — Spotlight`);
    }
    if (!formHeadline) {
      setFormHeadline(entity.title);
    }
    if (!formCustomImage && entity.imageUrl) {
      setFormCustomImage(entity.imageUrl);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEntity) {
      showToast('Please search and select a target Product, Manufacturer, or Opportunity.', 'error');
      return;
    }
    if (!formTitle.trim()) {
      showToast('Please provide a campaign title.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title: formTitle.trim(),
        type: formType,
        targetEntityType: selectedEntity.type,
        targetEntityId: selectedEntity.id,
        durationDays: formDurationDays,
        adminNotes: formNotes.trim(),
      };

      if (formType === 'KEYWORD_PIN') {
        payload.keywords = formKeywords.split(',').map(k => k.trim()).filter(Boolean);
        payload.slotPosition = Number(formSlot) || 1;
        if (payload.keywords.length === 0) {
          showToast('Please specify at least one keyword for Keyword Pin.', 'error');
          setActionLoading(false);
          return;
        }
      } else if (formType === 'EXPLORE_BANNER') {
        payload.bannerDetails = {
          headline: formHeadline.trim() || selectedEntity.title,
          subHeadline: formSubHeadline.trim(),
          badgeText: 'Featured Partner',
          customImageUrl: formCustomImage.trim(),
          investment: Number(formInvestment) || 25000,
          profitEstimate: formProfitEstimate.trim() || '30% - 40%',
          launchDays: 7,
        };
      }

      const res = await fetch('/api/admin/spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast('Spotlight promotion successfully activated!', 'success');
        setCreateModalOpen(false);
        resetForm();
        fetchCampaigns();
      } else {
        showToast(data.message || 'Failed to create promotion', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error creating promotion', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/admin/spotlight/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchCampaigns();
      } else {
        showToast(data.message || 'Failed to toggle status', 'error');
      }
    } catch {
      showToast('Network error toggling status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this promotion override? Default ranking will immediately resume.')) return;
    try {
      const res = await fetch(`/api/admin/spotlight/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchCampaigns();
      } else {
        showToast(data.message || 'Failed to delete promotion', 'error');
      }
    } catch {
      showToast('Network error deleting promotion', 'error');
    }
  };

  const handleClearAll = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/spotlight/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab === 'ALL' ? undefined : activeTab }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setClearAllConfirmOpen(false);
        fetchCampaigns();
      } else {
        showToast(data.message || 'Failed to clear overrides', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error clearing overrides', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEntity(null);
    setEntityQuery('');
    setEntityResults([]);
    setFormTitle('');
    setFormKeywords('');
    setFormSlot(1);
    setFormDurationDays(7);
    setFormHeadline('');
    setFormSubHeadline('');
    setFormCustomImage('');
    setFormNotes('');
  };

  const isExpired = (item) => new Date(item.endDate) < new Date();

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: toastMessage.type === 'error' ? '#EF4444' : '#10B981',
          color: '#FFFFFF', padding: '12px 20px', borderRadius: 8, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
          {toastMessage.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} color="#E8581C" />
            Spotlight &amp; Promotions Engine
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            Full control over keyword search pinning, trending feed boosts, and explore carousel banners.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setClearAllConfirmOpen(true)}
            className="admin-btn admin-btn-secondary"
            style={{ color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}
          >
            <Power size={14} />
            Purge All Active Overrides
          </button>

          <button
            onClick={() => { resetForm(); setCreateModalOpen(true); }}
            className="admin-btn admin-btn-primary"
            style={{ background: '#E8581C' }}
          >
            <Plus size={15} />
            New Promotion Override
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={14} color="#2563EB" />
            Active Keyword Pins
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {counts.activeKeywordPins}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Guaranteed top position on searched query</div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={14} color="#EA580C" />
            Active Trending Boosts
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {counts.activeTrendingBoosts}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Boosted to max priority score in trending feed</div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ImageIcon size={14} color="#7C3AED" />
            Explore Carousel Banners
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {counts.activeExploreBanners} <span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8' }}>/ 6</span>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Active front-page mobile explore slides (max 6)</div>
        </div>
      </div>

      {/* Main Filter / Tab Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        {/* Promotion Type Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
          {[
            { id: 'ALL', label: 'All Promotions' },
            { id: 'KEYWORD_PIN', label: '🔍 Keyword Pins' },
            { id: 'TRENDING_BOOST', label: '🔥 Trending Boosts' },
            { id: 'EXPLORE_BANNER', label: '🖼️ Explore Banners' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              style={{
                border: 'none',
                background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.id ? '#0F172A' : '#64748B',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                padding: '7px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search keyword, title, seller..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="admin-input"
              style={{ width: '100%', paddingLeft: 32, height: 36, fontSize: 13 }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="admin-select"
            style={{ height: 36, fontSize: 13 }}
          >
            <option value="all">All States</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired / Paused</option>
          </select>

          <button onClick={fetchCampaigns} className="admin-btn admin-btn-secondary" style={{ height: 36, padding: '0 12px' }}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Campaigns Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading spotlight overrides...</div>
      ) : campaigns.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
          <h3 style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>No Active Overrides Found</h3>
          <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#64748B' }}>
            Platform is currently sorting search results, trending feeds, and explore banners 100% organically by score.
          </p>
          <button onClick={() => { resetForm(); setCreateModalOpen(true); }} className="admin-btn admin-btn-primary">
            <Plus size={14} /> Create First Override
          </button>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Type</th>
                <th>Target Listing</th>
                <th>Override Details</th>
                <th>Validity &amp; Expiry</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 110, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((item) => {
                const expired = isExpired(item);
                return (
                  <tr key={item._id}>
                    <td>
                      {item.type === 'KEYWORD_PIN' && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#DBEAFE', color: '#1D4ED8' }}>
                          PIN
                        </span>
                      )}
                      {item.type === 'TRENDING_BOOST' && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#FFEDD5', color: '#C2410C' }}>
                          BOOST
                        </span>
                      )}
                      {item.type === 'EXPLORE_BANNER' && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#F3E8FF', color: '#7E22CE' }}>
                          BANNER
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {item.targetSnapshot?.imageUrl ? (
                          <img
                            src={item.targetSnapshot.imageUrl}
                            alt=""
                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', background: '#F1F5F9' }}
                          />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                            📦
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
                            {item.targetSnapshot?.title || item.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>
                            {item.targetEntityType} · {item.targetSnapshot?.sellerName || 'Verified'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {item.type === 'KEYWORD_PIN' && (
                        <div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(item.keywords || []).map((k) => (
                              <span key={k} style={{ fontSize: 11, background: '#EFF6FF', color: '#1E40AF', padding: '2px 6px', borderRadius: 4, border: '1px solid #BFDBFE' }}>
                                &quot;{k}&quot;
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                            Slot #{item.slotPosition || 1} on Search
                          </div>
                        </div>
                      )}

                      {item.type === 'TRENDING_BOOST' && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#C2410C' }}>
                            Score: Max (999,999 Priority)
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>
                            Forced to top of 48h behavioral feed
                          </div>
                        </div>
                      )}

                      {item.type === 'EXPLORE_BANNER' && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#7E22CE' }}>
                            {item.bannerDetails?.headline || item.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>
                            Slide #{item.slotPosition || 1} on Explore Carousel
                          </div>
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: expired ? '#DC2626' : '#0F172A' }}>
                        {expired ? 'Expired' : `Expires ${new Date(item.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>
                        Created by {item.createdByName || 'Admin'}
                      </div>
                    </td>

                    <td>
                      {expired ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '2px 8px', borderRadius: 10 }}>
                          Inactive
                        </span>
                      ) : item.isActive ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
                          Live
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 10 }}>
                          Paused
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggle(item._id)}
                          title={item.isActive ? 'Pause Override' : 'Activate Override'}
                          style={{
                            border: '1px solid #CBD5E1', background: '#FFFFFF', borderRadius: 6,
                            padding: '4px 8px', cursor: 'pointer', color: item.isActive ? '#16A34A' : '#64748B',
                          }}
                        >
                          <Power size={13} />
                        </button>

                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Delete Override"
                          style={{
                            border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: 6,
                            padding: '4px 8px', cursor: 'pointer', color: '#DC2626',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination" style={{ marginTop: 16 }}>
          <button className="admin-btn admin-btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="admin-btn admin-btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* ── CREATE PROMOTION MODAL ────────────────────────────────────────── */}
      {createModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 580,
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#E8581C" />
                Create Spotlight Promotion Override
              </h2>
              <button onClick={() => setCreateModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: 20 }}>
              {/* Type Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  PROMOTION OVERRIDE TYPE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'KEYWORD_PIN', title: 'Keyword Pin', desc: 'Top on search' },
                    { id: 'TRENDING_BOOST', title: 'Trending Boost', desc: 'Max score for N days' },
                    { id: 'EXPLORE_BANNER', title: 'Explore Banner', desc: 'Top carousel slide' },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setFormType(t.id)}
                      style={{
                        border: formType === t.id ? '2px solid #E8581C' : '1px solid #E2E8F0',
                        background: formType === t.id ? '#FFF7ED' : '#FAFAFA',
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: formType === t.id ? '#C2410C' : '#0F172A' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Entity Search & Autocomplete */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  TARGET LISTING TO PROMOTE
                </label>
                {selectedEntity ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {selectedEntity.imageUrl ? (
                        <img src={selectedEntity.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{selectedEntity.title}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{selectedEntity.type} · {selectedEntity.subtitle}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      style={{ border: 'none', background: 'transparent', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      {['ALL', 'Product', 'Manufacturer', 'MyProject'].map((ent) => (
                        <button
                          key={ent}
                          type="button"
                          onClick={() => setEntityTypeFilter(ent)}
                          style={{
                            border: '1px solid #E2E8F0',
                            background: entityTypeFilter === ent ? '#0F172A' : '#FFFFFF',
                            color: entityTypeFilter === ent ? '#FFFFFF' : '#64748B',
                            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                          }}
                        >
                          {ent === 'MyProject' ? 'Opportunity' : ent}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Type name of product, manufacturer, or opportunity..."
                      value={entityQuery}
                      onChange={(e) => setEntityQuery(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', height: 36, fontSize: 13 }}
                    />

                    {entitySearching && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Searching catalog...</div>}

                    {entityResults.length > 0 && (
                      <div style={{
                        marginTop: 4, maxHeight: 180, overflowY: 'auto', border: '1px solid #E2E8F0',
                        borderRadius: 6, background: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}>
                        {entityResults.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => handleSelectEntity(r)}
                            style={{
                              padding: '8px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {r.imageUrl ? (
                                <img src={r.imageUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                              ) : null}
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{r.title}</div>
                                <div style={{ fontSize: 10, color: '#64748B' }}>{r.type} · {r.subtitle}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: 11, color: '#E8581C', fontWeight: 700 }}>Select</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Campaign Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  CAMPAIGN TITLE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diwal Special machinery pin"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', height: 36, fontSize: 13 }}
                  required
                />
              </div>

              {/* TYPE-SPECIFIC FIELDS */}
              {formType === 'KEYWORD_PIN' && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      TRIGGER KEYWORDS (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. cotton t-shirt, tshirts, apparel manufacturer"
                      value={formKeywords}
                      onChange={(e) => setFormKeywords(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', height: 36, fontSize: 13 }}
                      required
                    />
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      Anytime a buyer searches any of these keywords, this listing is pinned to the top.
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      SLOT POSITION (1 = TOP)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formSlot}
                      onChange={(e) => setFormSlot(Math.max(1, parseInt(e.target.value) || 1))}
                      className="admin-input"
                      style={{ width: '100%', height: 36, fontSize: 13 }}
                    />
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      Pin to any search result position (Slot 1 = absolute top). No restrictions.
                    </div>
                  </div>
                </>
              )}

              {formType === 'EXPLORE_BANNER' && (
                <>
                  <div style={{ padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 14, fontSize: 12, color: '#475569' }}>
                    ℹ️ <strong>Explore Banner Capacity:</strong> Maximum <strong>6 active banners</strong> rotate in the header carousel at once.
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      BANNER HEADLINE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leading CNC Machine Manufacturer in India"
                      value={formHeadline}
                      onChange={(e) => setFormHeadline(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', height: 36, fontSize: 13 }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      CUSTOM 16:9 BANNER IMAGE URL (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="https://... (High resolution landscape photo)"
                      value={formCustomImage}
                      onChange={(e) => setFormCustomImage(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', height: 36, fontSize: 13 }}
                    />
                  </div>
                </>
              )}

              {/* Duration (Days) */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  BOOST DURATION
                </label>
                <select
                  value={formDurationDays}
                  onChange={(e) => setFormDurationDays(Number(e.target.value))}
                  className="admin-select"
                  style={{ width: '100%', height: 36, fontSize: 13 }}
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={60}>60 Days</option>
                </select>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  Override will automatically expire and revert to natural score.
                </div>
              </div>

              {/* Admin Note */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  INTERNAL AUDIT NOTE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid promotion via agreement #XIN-2026"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', height: 36, fontSize: 13 }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="admin-btn admin-btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#E8581C' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Activating...' : 'Activate Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REQUIREMENT 4: CLEAR ALL CONFIRM MODAL ──────────────────────── */}
      {clearAllConfirmOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginBottom: 14 }}>
              <Power size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              Purge All Active Overrides?
            </h3>
            <p style={{ margin: '8px 0 20px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              This will immediately deactivate all manual overrides ({activeTab === 'ALL' ? 'Search Pins, Trending Boosts & Banners' : activeTab}).
              <br /><br />
              <strong>Natural Algorithmic Score will take over instantly.</strong> The true mathematical winners will automatically be placed at the top.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setClearAllConfirmOpen(false)}
                className="admin-btn admin-btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="admin-btn"
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none' }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Purging...' : 'Yes, Purge Overrides'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSpotlightPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: '#64748B' }}>Loading Spotlight Engine...</div>}>
      <SpotlightContent />
    </Suspense>
  );
}
