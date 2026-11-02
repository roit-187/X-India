'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import {
  Sparkles,
  Search,
  Trash2,
  Power,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  Tag,
  Flame,
  Image as ImageIcon,
  Factory,
  Package,
  Upload,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Clock,
  Eye,
  CheckCircle2,
} from 'lucide-react';

const BANNER_PRESETS = {
  navy: {
    id: 'navy',
    name: 'Royal Navy',
    colors: ['#0B192C', '#1E3E62'],
    accent: '#FF5E13',
    ctaBg: '#FFFFFF',
    ctaText: '#0F172A',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Pro',
    colors: ['#064E3B', '#059669'],
    accent: '#FDE68A',
    ctaBg: '#FFFFFF',
    ctaText: '#064E3B',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Dark',
    colors: ['#0A0F1D', '#1E293B'],
    accent: '#38BDF8',
    ctaBg: '#FFFFFF',
    ctaText: '#0F172A',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: ['#7C2D12', '#C2410C'],
    accent: '#FEF08A',
    ctaBg: '#FFFFFF',
    ctaText: '#7C2D12',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Elite',
    colors: ['#581C87', '#7E22CE'],
    accent: '#F472B6',
    ctaBg: '#FFFFFF',
    ctaText: '#3B0764',
  },
};

function SpotlightContent() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const searchParams = useSearchParams();

  // Top Section: 'PRODUCTS' | 'BUSINESSES' | 'BANNERS'
  const [section, setSection] = useState('PRODUCTS');

  // Data & Pagination
  const [campaigns, setCampaigns] = useState([]);
  const [counts, setCounts] = useState({
    activeKeywordPins: 0,
    activeTrendingBoosts: 0,
    activeExploreBanners: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Sub-filters for Products and Businesses
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | KEYWORD_PIN | TRENDING_BOOST
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | expired
  const [search, setSearch] = useState('');

  // Modals & Action States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Entity Autocomplete State
  const [entityQuery, setEntityQuery] = useState('');
  const [entityResults, setEntityResults] = useState([]);
  const [entitySearching, setEntitySearching] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Form Fields
  const [formType, setFormType] = useState('KEYWORD_PIN'); // KEYWORD_PIN | TRENDING_BOOST | EXPLORE_BANNER
  const [formTitle, setFormTitle] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formSlot, setFormSlot] = useState(1);
  const [formPriority, setFormPriority] = useState(1);
  const [formDurationDays, setFormDurationDays] = useState(7);
  const [formHeadline, setFormHeadline] = useState('');
  const [formSubHeadline, setFormSubHeadline] = useState('');
  const [formCustomImage, setFormCustomImage] = useState('');
  const [formInvestment, setFormInvestment] = useState(25000);
  const [formProfitEstimate, setFormProfitEstimate] = useState('₹40K – ₹80K');
  const [formLaunchDays, setFormLaunchDays] = useState(7);
  const [formNotes, setFormNotes] = useState('');

  // Fully Customizable Banner Form State
  const [bannerTagline, setBannerTagline] = useState('Start Your Own');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerMetrics, setBannerMetrics] = useState([
    { label: 'Avg. Profits', value: '₹40K – 80K', subtext: 'per month' },
    { label: 'Launch in', value: '7 Days', subtext: '' },
    { label: 'Start with', value: '₹25,000', subtext: '' },
  ]);
  const [bannerSocialProofEnabled, setBannerSocialProofEnabled] = useState(true);
  const [bannerSocialProofText, setBannerSocialProofText] = useState('36 founders created');
  const [bannerCtaText, setBannerCtaText] = useState('Explore Now');
  const [bannerPreset, setBannerPreset] = useState('navy');
  const [bannerThumbnail, setBannerThumbnail] = useState('');
  const [bannerTargetKind, setBannerTargetKind] = useState('ENTITY');
  const [bannerDeepLinkUrl, setBannerDeepLinkUrl] = useState('');
  const [bannerBackground, setBannerBackground] = useState('');
  const [previewWidth, setPreviewWidth] = useState(343);

  // Image Upload State for Banners
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBgImage, setUploadingBgImage] = useState(false);
  const fileInputRef = useRef(null);
  const bgFileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
      });

      if (section === 'BANNERS') {
        params.set('type', 'EXPLORE_BANNER');
      } else {
        if (typeFilter !== 'ALL') params.set('type', typeFilter);
        // Products vs Business listings targetEntityType filter
        const targetType = section === 'PRODUCTS' ? 'Product' : 'Manufacturer';
        params.set('targetEntityType', targetType);
      }

      // Banners section has no status/search filters exposed in UI —
      // skip stale values carried over from Products/Businesses tabs.
      if (section !== 'BANNERS') {
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());
      }

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
  }, [page, section, typeFilter, statusFilter, search]);

  useEffect(() => {
    if (loaded) {
      fetchCampaigns();
    }
  }, [loaded, fetchCampaigns]);

  const handleSelectEntity = useCallback(async (entity) => {
    setSelectedEntity(entity);
    setFormTitle((prev) => prev || `${entity.title} — Spotlight`);
    setFormHeadline(entity.title || '');
    setFormSubHeadline(entity.subtitle || '');
    setFormCustomImage(entity.imageUrl || '');
    setBannerThumbnail(entity.imageUrl || '');
    setBannerTitle(entity.title || '');

    try {
      const res = await fetch(`/api/admin/spotlight/banner-defaults?entityType=${entity.type}&entityId=${entity.id}`);
      const data = await res.json();
      if (data.success && data.data?.defaults) {
        const d = data.data.defaults;
        setBannerTagline(d.tagline || 'Start Your Own');
        setBannerTitle(d.title || entity.title || '');
        if (Array.isArray(d.metrics) && d.metrics.length > 0) {
          setBannerMetrics(d.metrics);
        }
        setBannerSocialProofEnabled(d.socialProof?.enabled !== false);
        setBannerSocialProofText(d.socialProof?.text || '36 founders created');
        setBannerCtaText(d.cta?.text || 'Explore Now');
        setBannerPreset(d.preset || 'navy');
        setBannerThumbnail(d.thumbnailUrl || entity.imageUrl || '');
        setBannerBackground(d.backgroundUrl || '');
        setBannerTargetKind(d.target?.kind || 'ENTITY');
        setBannerDeepLinkUrl(d.target?.deepLinkUrl || '');
      }
    } catch (err) {
      console.warn('Failed to fetch banner defaults:', err);
    }
  }, []);

  // Handle incoming shortcut params from Products or Manufacturers tables
  useEffect(() => {
    const promoteType = searchParams.get('promoteType');
    const promoteId = searchParams.get('promoteId');
    if (promoteType && promoteId) {
      if (promoteType === 'Product') setSection('PRODUCTS');
      if (promoteType === 'Manufacturer') setSection('BUSINESSES');

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
  }, [searchParams, handleSelectEntity]);

  // Entity Search Autocomplete
  useEffect(() => {
    if (!createModalOpen || entityQuery.trim().length < 2) {
      setEntityResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setEntitySearching(true);
        const searchEntityType = section === 'PRODUCTS' ? 'Product' : section === 'BANNERS' ? 'ALL' : 'Manufacturer';
        const res = await fetch(
          `/api/admin/spotlight/search-entities?q=${encodeURIComponent(entityQuery.trim())}&entityType=${searchEntityType}`
        );
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
  }, [entityQuery, section, createModalOpen]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/spotlight/upload-banner', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setFormCustomImage(data.url);
        showToast('Banner thumbnail uploaded successfully to R2!');
      } else {
        showToast(data.message || 'Image upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Network error uploading banner image', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBgImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }

    try {
      setUploadingBgImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/spotlight/upload-banner', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setBannerBackground(data.url);
        showToast('Full banner background uploaded successfully to R2!');
      } else {
        showToast(data.message || 'Background image upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Network error uploading background image', 'error');
    } finally {
      setUploadingBgImage(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    }
  };

  const openCreateForSection = (targetSlot = null) => {
    resetForm();
    if (section === 'BANNERS') {
      setFormType('EXPLORE_BANNER');
      if (targetSlot) setFormSlot(targetSlot);
    } else {
      setFormType(typeFilter === 'TRENDING_BOOST' ? 'TRENDING_BOOST' : 'KEYWORD_PIN');
    }
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEntity) {
      showToast(
        section === 'PRODUCTS'
          ? 'Please search and select a target Product.'
          : 'Please search and select a target Business Listing.',
        'error'
      );
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
        type: section === 'BANNERS' ? 'EXPLORE_BANNER' : formType,
        targetEntityType: selectedEntity.type,
        targetEntityId: selectedEntity.id,
        durationDays: formDurationDays,
        adminNotes: formNotes.trim(),
      };

      if (payload.type === 'KEYWORD_PIN') {
        payload.keywords = formKeywords.split(',').map((k) => k.trim()).filter(Boolean);
        payload.slotPosition = Number(formSlot) || 1;
        if (payload.keywords.length === 0) {
          showToast('Please specify at least one search keyword.', 'error');
          setActionLoading(false);
          return;
        }
      } else if (payload.type === 'TRENDING_BOOST') {
        payload.priority = Number(formPriority) || 1;
        payload.slotPosition = Number(formPriority) || 1;
      } else if (payload.type === 'EXPLORE_BANNER') {
        payload.slotPosition = Number(formSlot) || 1;
        const finalThumbnail = bannerThumbnail.trim() || formCustomImage.trim() || selectedEntity.imageUrl || '';
        payload.bannerConfig = {
          version: 2,
          tagline: bannerTagline.trim() || 'Start Your Own',
          title: bannerTitle.trim() || selectedEntity.title || 'Featured Opportunity',
          metrics: bannerMetrics.map((m) => ({
            label: (m.label || '').trim(),
            value: (m.value || '').trim(),
            subtext: (m.subtext || '').trim(),
          })),
          socialProof: {
            enabled: bannerSocialProofEnabled,
            text: bannerSocialProofText.trim() || '36 founders created',
          },
          cta: {
            text: bannerCtaText.trim() || 'Explore Now',
          },
          thumbnailUrl: finalThumbnail,
          backgroundUrl: bannerBackground.trim(),
          preset: bannerPreset || 'navy',
          target: {
            kind: bannerTargetKind || 'ENTITY',
            deepLinkUrl: bannerDeepLinkUrl.trim(),
          },
        };
        payload.bannerDetails = {
          headline: payload.bannerConfig.title,
          subHeadline: payload.bannerConfig.tagline,
          badgeText: 'Featured Partner',
          customImageUrl: finalThumbnail,
          backgroundImageUrl: bannerBackground.trim(),
          deepLinkUrl: payload.bannerConfig.target?.deepLinkUrl || '',
          investment: Number(formInvestment) || 25000,
          profitEstimate: bannerMetrics[0]?.value || '₹40K – ₹80K',
          launchDays: Number(formLaunchDays) || 7,
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

  const handleMoveBannerSlot = async (campaign, delta) => {
    const currentSlot = campaign.slotPosition || 1;
    const targetSlot = Math.min(Math.max(currentSlot + delta, 1), 6);
    if (targetSlot === currentSlot) return;

    try {
      const res = await fetch(`/api/admin/spotlight/${campaign._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotPosition: targetSlot }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Moved to Slide Slot #${targetSlot}`);
        fetchCampaigns();
      } else {
        showToast(data.message || 'Failed to reorder banner', 'error');
      }
    } catch {
      showToast('Error updating slide position', 'error');
    }
  };

  const handleClearAll = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/spotlight/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: section === 'BANNERS' ? 'EXPLORE_BANNER' : undefined,
        }),
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
    setFormPriority(1);
    setFormDurationDays(7);
    setFormHeadline('');
    setFormSubHeadline('');
    setFormCustomImage('');
    setFormInvestment(25000);
    setFormProfitEstimate('₹40K – ₹80K');
    setFormLaunchDays(7);
    setFormNotes('');

    setBannerTagline('Start Your Own');
    setBannerTitle('');
    setBannerMetrics([
      { label: 'Avg. Profits', value: '₹40K – 80K', subtext: 'per month' },
      { label: 'Launch in', value: '7 Days', subtext: '' },
      { label: 'Start with', value: '₹25,000', subtext: '' },
    ]);
    setBannerSocialProofEnabled(true);
    setBannerSocialProofText('36 founders created');
    setBannerCtaText('Explore Now');
    setBannerPreset('navy');
    setBannerThumbnail('');
    setBannerBackground('');
    setBannerTargetKind('ENTITY');
    setBannerDeepLinkUrl('');
    setPreviewWidth(343);
  };

  const isExpired = (item) => new Date(item.endDate) < new Date();

  // ── Render 6-Slot Grid for Banners ──────────────────────────────────────────
  const renderBannerStoryboard = () => {
    const activeBanners = campaigns.filter((c) => c.type === 'EXPLORE_BANNER' && c.isActive && !isExpired(c));
    const slots = [1, 2, 3, 4, 5, 6].map((slotNum) => {
      const banner = activeBanners.find((b) => (b.slotPosition || 1) === slotNum);
      return { slotNum, banner };
    });

    return (
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={18} color="#7C3AED" />
              Explore Hero Carousel (Max 6 Active Slides)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              These slides rotate automatically at the top of the mobile app&apos;s Explore screen.
            </p>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: activeBanners.length >= 6 ? '#EA580C' : '#10B981' }}>
            {activeBanners.length} / 6 Slots Occupied
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {slots.map(({ slotNum, banner }) => {
            if (banner) {
              const details = banner.bannerDetails || {};
              const cfg = banner.bannerConfig && banner.bannerConfig.version === 2 ? banner.bannerConfig : null;
              const tagline = cfg?.tagline || 'Start Your Own';
              const title = cfg?.title || details.headline || banner.targetSnapshot?.title || banner.title;
              const preset = (cfg?.preset && BANNER_PRESETS[cfg.preset]) ? BANNER_PRESETS[cfg.preset] : BANNER_PRESETS.navy;
              const imgUrl = cfg?.thumbnailUrl || details.customImageUrl || banner.targetSnapshot?.imageUrl;
              const bgUrl = cfg?.backgroundUrl || details.backgroundImageUrl || null;
              const metrics = cfg?.metrics?.length ? cfg.metrics : [
                { label: 'Profits', value: details.profitEstimate || '30%-40%' },
                { label: 'Start', value: `₹${Number(details.investment || 25000).toLocaleString('en-IN')}` },
                { label: 'Launch', value: `${details.launchDays || 7} Days` },
              ];
              return (
                <div
                  key={slotNum}
                  className="admin-card"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderColor: '#CBD5E1',
                    background: '#FFFFFF',
                    padding: 16,
                  }}
                >
                  {/* Slot Number Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#7C3AED', color: '#FFFFFF' }}>
                      SLOT #{slotNum}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> Active in App
                    </span>
                  </div>

                  {/* Simulated Mobile Card Mini Preview */}
                  <div
                    style={{
                      borderRadius: 12,
                      background: bgUrl ? '#0F172A' : `linear-gradient(135deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`,
                      padding: 14,
                      color: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative',
                      minHeight: 110,
                      boxShadow: '0 4px 12px rgba(3,16,36,0.3)',
                      overflow: 'hidden',
                    }}
                  >
                    {bgUrl && (
                      <img
                        src={bgUrl}
                        alt=""
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          zIndex: 0,
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: bgUrl
                          ? `linear-gradient(135deg, ${preset.colors[0]}CC 0%, ${preset.colors[1]}F2 100%)`
                          : `linear-gradient(135deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`,
                        zIndex: 1,
                      }}
                    />

                    <div style={{ flex: 1, paddingRight: 10, position: 'relative', zIndex: 2 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: preset.accent, textTransform: 'uppercase' }}>
                        {tagline}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginTop: 2 }}>
                        {title}
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {metrics.map((m, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 4, fontSize: 9 }}>
                            {m.label ? `${m.label}: ` : ''}{m.value}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 78x94 Portrait Thumbnail Badge */}
                    <div
                      style={{
                        width: 58,
                        height: 70,
                        borderRadius: 8,
                        background: '#0F172A',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.15)',
                        position: 'relative',
                        zIndex: 2,
                      }}
                    >
                      {imgUrl ? (
                        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                          🏭
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reorder and Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleMoveBannerSlot(banner, -1)}
                        disabled={slotNum === 1}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11, opacity: slotNum === 1 ? 0.4 : 1 }}
                        title="Move Slide Left"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        onClick={() => handleMoveBannerSlot(banner, 1)}
                        disabled={slotNum === 6}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11, opacity: slotNum === 6 ? 0.4 : 1 }}
                        title="Move Slide Right"
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleToggle(banner._id)}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        title="Remove Slide"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={slotNum}
                onClick={() => openCreateForSection(slotNum)}
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: 12,
                  padding: 24,
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.background = '#F5F3FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.background = '#F8FAFC';
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>
                  SLOT #{slotNum} (EMPTY)
                </span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Plus size={18} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Assign Business to Slide #{slotNum}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Tap to search and upload banner</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 24,
            zIndex: 9999,
            background: toastMessage.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 8,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
          {toastMessage.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} color="#E8581C" />
            Spotlight &amp; Promotions Engine
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            Direct priority placement across Search Keywords, Trending Feeds, and the Explore Carousel.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setClearAllConfirmOpen(true)}
            className="admin-btn admin-btn-secondary"
            style={{ color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}
          >
            <Power size={14} />
            Purge Active Overrides
          </button>

          <button
            onClick={() => openCreateForSection()}
            className="admin-btn admin-btn-primary"
            style={{ background: '#E8581C' }}
          >
            <Plus size={15} />
            {section === 'BANNERS' ? 'Add Explore Banner' : section === 'PRODUCTS' ? 'Promote Product' : 'Promote Business'}
          </button>
        </div>
      </div>

      {/* ── 3 PRIMARY SECTION TABS ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '2px solid #E2E8F0', paddingBottom: 12 }}>
        <button
          onClick={() => { setSection('PRODUCTS'); setPage(1); }}
          style={{
            border: 'none',
            background: section === 'PRODUCTS' ? '#0F172A' : '#F1F5F9',
            color: section === 'PRODUCTS' ? '#FFFFFF' : '#475569',
            fontWeight: 700,
            fontSize: 14,
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <Package size={17} />
          1. Products
          <span style={{ fontSize: 11, background: section === 'PRODUCTS' ? 'rgba(255,255,255,0.2)' : '#E2E8F0', padding: '2px 6px', borderRadius: 10 }}>
            {section === 'PRODUCTS' ? total : ''}
          </span>
        </button>

        <button
          onClick={() => { setSection('BUSINESSES'); setPage(1); }}
          style={{
            border: 'none',
            background: section === 'BUSINESSES' ? '#0F172A' : '#F1F5F9',
            color: section === 'BUSINESSES' ? '#FFFFFF' : '#475569',
            fontWeight: 700,
            fontSize: 14,
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <Factory size={17} />
          2. Business Listings (Manufacturers)
          <span style={{ fontSize: 11, background: section === 'BUSINESSES' ? 'rgba(255,255,255,0.2)' : '#E2E8F0', padding: '2px 6px', borderRadius: 10 }}>
            {section === 'BUSINESSES' ? total : ''}
          </span>
        </button>

        <button
          onClick={() => { setSection('BANNERS'); setPage(1); }}
          style={{
            border: 'none',
            background: section === 'BANNERS' ? '#7C3AED' : '#F1F5F9',
            color: section === 'BANNERS' ? '#FFFFFF' : '#475569',
            fontWeight: 700,
            fontSize: 14,
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <ImageIcon size={17} />
          3. Explore Banners (Carousel)
          <span style={{ fontSize: 11, background: section === 'BANNERS' ? 'rgba(255,255,255,0.2)' : '#E2E8F0', padding: '2px 6px', borderRadius: 10 }}>
            {counts.activeExploreBanners} / 6
          </span>
        </button>
      </div>

      {/* ── BANNERS SECTION: 6-SLOT STORYBOARD ────────────────────────────── */}
      {section === 'BANNERS' && renderBannerStoryboard()}

      {/* Sub-Filters and Table Header for Products & Businesses */}
      {section !== 'BANNERS' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          {/* Promotion Type Pills */}
          <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
            {[
              { id: 'ALL', label: 'All Promotions' },
              { id: 'KEYWORD_PIN', label: '🔍 Keyword Pins (Search)' },
              { id: 'TRENDING_BOOST', label: '🔥 Trending Boosts (Feed)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setTypeFilter(tab.id); setPage(1); }}
                style={{
                  border: 'none',
                  background: typeFilter === tab.id ? '#FFFFFF' : 'transparent',
                  color: typeFilter === tab.id ? '#0F172A' : '#64748B',
                  fontWeight: typeFilter === tab.id ? 700 : 500,
                  fontSize: 13,
                  padding: '7px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: typeFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
                placeholder={section === 'PRODUCTS' ? 'Search product or keyword...' : 'Search business or keyword...'}
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
      )}

      {/* Campaigns Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading promotions...</div>
      ) : campaigns.length === 0 && section !== 'BANNERS' ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
          <h3 style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
            No Active {section === 'PRODUCTS' ? 'Product' : 'Business'} Overrides
          </h3>
          <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#64748B' }}>
            Rankings are currently calculated 100% naturally by algorithmic engagement score.
          </p>
          <button onClick={() => openCreateForSection()} className="admin-btn admin-btn-primary">
            <Plus size={14} /> Promote First {section === 'PRODUCTS' ? 'Product' : 'Business'}
          </button>
        </div>
      ) : (
        section !== 'BANNERS' && (
          <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Type</th>
                  <th>Target Listing</th>
                  <th>Priority &amp; Placement</th>
                  <th>Validity &amp; Expiry</th>
                  <th style={{ width: 90 }}>Status</th>
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
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#DBEAFE', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Tag size={11} /> PIN
                          </span>
                        )}
                        {item.type === 'TRENDING_BOOST' && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#FFEDD5', color: '#C2410C', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Flame size={11} /> BOOST
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
                              {section === 'PRODUCTS' ? '📦' : '🏭'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
                              {item.targetSnapshot?.title || item.title}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>
                              {item.targetSnapshot?.sellerName || 'Verified'} · {item.targetSnapshot?.subtitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {item.type === 'KEYWORD_PIN' && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>
                              Search Slot #{item.slotPosition || 1}
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                              {(item.keywords || []).map((kw, i) => (
                                <span key={i} style={{ fontSize: 11, padding: '2px 6px', background: '#F1F5F9', borderRadius: 4, color: '#475569' }}>
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.type === 'TRENDING_BOOST' && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#C2410C' }}>
                              Priority Rank #{item.priority || item.slotPosition || 1}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                              Max score injected into trending feed
                            </div>
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>
                          {new Date(item.startDate).toLocaleDateString('en-IN')} ➔ {new Date(item.endDate).toLocaleDateString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, color: expired ? '#DC2626' : '#10B981', fontWeight: 600, marginTop: 2 }}>
                          {expired ? 'Expired' : `Active (${Math.max(0, Math.ceil((new Date(item.endDate) - new Date()) / 86400000))} days left)`}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-badge ${item.isActive && !expired ? 'admin-badge-green' : 'admin-badge-gray'}`}
                          style={{ fontSize: 11 }}
                        >
                          {item.isActive && !expired ? 'Active' : item.isActive && expired ? 'Ended' : 'Paused'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleToggle(item._id)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            title={item.isActive ? 'Pause promotion' : 'Resume promotion'}
                          >
                            {item.isActive ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            title="Delete override"
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
        )
      )}

      {/* ── CREATE / CONFIGURE MODAL ────────────────────────────────────── */}
      {createModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              width: '100%',
              maxWidth: section === 'BANNERS' ? 620 : 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: '#FFFFFF',
                zIndex: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#E8581C" />
                {section === 'BANNERS'
                  ? `Configure Explore Banner (Slide #${formSlot})`
                  : section === 'PRODUCTS'
                  ? 'Promote Product'
                  : 'Promote Business Listing'}
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: 24 }}>
              {/* Promotion Type Selector for Products and Businesses */}
              {section !== 'BANNERS' && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                    Promotion Override Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div
                      onClick={() => setFormType('KEYWORD_PIN')}
                      style={{
                        border: '2px solid',
                        borderColor: formType === 'KEYWORD_PIN' ? '#2563EB' : '#E2E8F0',
                        borderRadius: 10,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        background: formType === 'KEYWORD_PIN' ? '#EFF6FF' : '#FFFFFF',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={15} /> Keyword Pin
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Pin to top on searched keywords</div>
                    </div>

                    <div
                      onClick={() => setFormType('TRENDING_BOOST')}
                      style={{
                        border: '2px solid',
                        borderColor: formType === 'TRENDING_BOOST' ? '#EA580C' : '#E2E8F0',
                        borderRadius: 10,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        background: formType === 'TRENDING_BOOST' ? '#FFF7ED' : '#FFFFFF',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#C2410C', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Flame size={15} /> Trending Boost
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Boost to top of trending feed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Entity Search & Select */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                  {section === 'PRODUCTS' ? 'Select Target Product' : 'Select Target Business Listing'}
                </label>

                {selectedEntity ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {selectedEntity.imageUrl ? (
                        <img src={selectedEntity.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {section === 'PRODUCTS' ? '📦' : '🏭'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{selectedEntity.title}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{selectedEntity.subtitle}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setSelectedEntity(null); setEntityQuery(''); }}
                      style={{ border: 'none', background: 'transparent', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder={section === 'PRODUCTS' ? 'Type product name to search catalog...' : 'Type manufacturer or factory name to search...'}
                      value={entityQuery}
                      onChange={(e) => setEntityQuery(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', height: 38, fontSize: 13 }}
                    />

                    {entitySearching && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Searching catalog...</div>}

                    {entityResults.length > 0 && (
                      <div
                        style={{
                          marginTop: 4,
                          maxHeight: 180,
                          overflowY: 'auto',
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
                          background: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      >
                        {entityResults.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => handleSelectEntity(r)}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid #F1F5F9',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {r.imageUrl ? (
                                <img src={r.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                              ) : null}
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{r.title}</div>
                                <div style={{ fontSize: 11, color: '#64748B' }}>{r.subtitle}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: 12, color: '#E8581C', fontWeight: 700 }}>Select</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── BANNER SPECIFIC: FULLY CUSTOMIZABLE TEMPLATE & LIVE MOBILE PREVIEW ──── */}
              {section === 'BANNERS' && (
                <div style={{ marginBottom: 20 }}>
                  {/* Live Mobile App Carousel Preview Header & Width Switcher */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Eye size={14} color="#2563EB" /> 1:1 Live Mobile Preview
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#64748B', marginRight: 4 }}>Phone Width:</span>
                      {[
                        { label: '343px', val: 343 },
                        { label: '375px', val: 375 },
                        { label: '430px', val: 430 },
                      ].map((w) => (
                        <button
                          key={w.val}
                          type="button"
                          onClick={() => setPreviewWidth(w.val)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: '1px solid',
                            borderColor: previewWidth === w.val ? '#2563EB' : '#CBD5E1',
                            background: previewWidth === w.val ? '#EFF6FF' : '#FFFFFF',
                            color: previewWidth === w.val ? '#1D4ED8' : '#64748B',
                            fontSize: 10,
                            fontWeight: previewWidth === w.val ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1:1 Live Mobile Carousel Card */}
                  {(() => {
                    const preset = BANNER_PRESETS[bannerPreset] || BANNER_PRESETS.navy;
                    const finalImg = bannerThumbnail || formCustomImage || selectedEntity?.imageUrl || '';
                    const finalBg = bannerBackground.trim();
                    return (
                      <div
                        style={{
                          width: '100%',
                          maxWidth: previewWidth,
                          height: 188,
                          borderRadius: 16,
                          background: finalBg ? '#031024' : `linear-gradient(135deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`,
                          padding: 16,
                          boxSizing: 'border-box',
                          display: 'flex',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          margin: '0 auto 16px auto',
                          transition: 'max-width 0.2s ease',
                        }}
                      >
                        {finalBg ? (
                          <img
                            src={finalBg}
                            alt=""
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              zIndex: 0,
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: finalBg
                              ? `linear-gradient(135deg, ${preset.colors[0]}CC 0%, ${preset.colors[1]}F2 100%)`
                              : `linear-gradient(135deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`,
                            zIndex: 1,
                          }}
                        />

                        {/* Left Content Area (66% width) */}
                        <div style={{ width: '66%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', position: 'relative', zIndex: 2 }}>
                          {/* Overline / Tagline */}
                          <div
                            style={{
                              color: preset.accent,
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {bannerTagline || 'Start Your Own'}
                          </div>

                          {/* Main Title (2-line max) */}
                          <div
                            style={{
                              color: '#FFFFFF',
                              fontSize: 16,
                              fontWeight: 800,
                              lineHeight: '20px',
                              marginTop: 2,
                              minHeight: 40,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {bannerTitle || selectedEntity?.title || 'Business Opportunity Title'}
                          </div>

                          {/* 3 Metrics Row */}
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                            {bannerMetrics.map((m, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ color: '#94A3B8', fontSize: 9, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {m.label || `Metric ${idx + 1}`}
                                  </span>
                                  <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700, marginTop: 1, whiteSpace: 'nowrap' }}>
                                    {m.value || '—'}
                                  </span>
                                  {m.subtext ? (
                                    <span style={{ color: '#94A3B8', fontSize: 8, marginTop: 1, whiteSpace: 'nowrap' }}>
                                      {m.subtext}
                                    </span>
                                  ) : null}
                                </div>
                                {idx < bannerMetrics.length - 1 && (
                                  <div style={{ width: 1, height: 22, backgroundColor: 'rgba(255, 255, 255, 0.18)', margin: '0 10px' }} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Thumbnail Image (86x104) */}
                        <div
                          style={{
                            width: 86,
                            height: 104,
                            borderRadius: 12,
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            position: 'relative',
                            zIndex: 2,
                          }}
                        >
                          {finalImg ? (
                            <img src={finalImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 11, textAlign: 'center', padding: 4 }}>
                              86×104 Image
                            </div>
                          )}
                        </div>

                        {/* Bottom-Left Social Proof Footer */}
                        {bannerSocialProofEnabled && (
                          <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', alignItems: 'center', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {[
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=60',
                                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=60',
                                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=60',
                              ].map((uri, idx) => (
                                <img
                                  key={idx}
                                  src={uri}
                                  alt=""
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    border: '1px solid #031024',
                                    marginLeft: idx > 0 ? -5 : 0,
                                    objectFit: 'cover',
                                  }}
                                />
                              ))}
                            </div>
                            <span style={{ color: '#E2E8F0', fontSize: 9, fontWeight: 500, marginLeft: 6, maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {bannerSocialProofText || '36 founders created'}
                            </span>
                          </div>
                        )}

                        {/* Bottom-Right CTA Button */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 12,
                            right: 14,
                            backgroundColor: preset.ctaBg,
                            color: preset.ctaText,
                            borderRadius: 14,
                            padding: '5px 11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            zIndex: 2,
                          }}
                        >
                          <span>{bannerCtaText || 'Explore Now'}</span>
                          <span>→</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Granular Edit Controls ── */}
                  <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: 16 }}>
                    {/* 1. Tagline & Main Title */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                            Banner Tagline
                          </label>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>{bannerTagline.length}/28</span>
                        </div>
                        <input
                          type="text"
                          maxLength={28}
                          value={bannerTagline}
                          onChange={(e) => setBannerTagline(e.target.value)}
                          placeholder="e.g. Start Your Own"
                          className="admin-input"
                          style={{ width: '100%', height: 36, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                            Banner Headline (2 Lines Max)
                          </label>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>{bannerTitle.length}/65</span>
                        </div>
                        <input
                          type="text"
                          maxLength={65}
                          value={bannerTitle}
                          onChange={(e) => setBannerTitle(e.target.value)}
                          placeholder="e.g. Workwear & Safety Equipment Manufacturer"
                          className="admin-input"
                          style={{ width: '100%', height: 36, fontSize: 13 }}
                        />
                      </div>
                    </div>

                    {/* 2. 3 Metrics Columns */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                          3 Highlights / Metrics Columns
                        </label>
                        {selectedEntity && (
                          <button
                            type="button"
                            onClick={() => handleSelectEntity(selectedEntity)}
                            style={{ border: 'none', background: 'transparent', color: '#2563EB', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <RefreshCw size={11} /> Reset to Defaults
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {bannerMetrics.map((m, idx) => (
                          <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                              Metric #{idx + 1}
                            </div>
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="Label (e.g. Avg. Profits)"
                              value={m.label}
                              onChange={(e) => {
                                const copy = [...bannerMetrics];
                                copy[idx] = { ...copy[idx], label: e.target.value };
                                setBannerMetrics(copy);
                              }}
                              className="admin-input"
                              style={{ width: '100%', height: 30, fontSize: 11, marginBottom: 6 }}
                            />
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="Value (e.g. ₹85K)"
                              value={m.value}
                              onChange={(e) => {
                                const copy = [...bannerMetrics];
                                copy[idx] = { ...copy[idx], value: e.target.value };
                                setBannerMetrics(copy);
                              }}
                              className="admin-input"
                              style={{ width: '100%', height: 30, fontSize: 11, fontWeight: 700, marginBottom: 6 }}
                            />
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="Subtext (e.g. per month)"
                              value={m.subtext}
                              onChange={(e) => {
                                const copy = [...bannerMetrics];
                                copy[idx] = { ...copy[idx], subtext: e.target.value };
                                setBannerMetrics(copy);
                              }}
                              className="admin-input"
                              style={{ width: '100%', height: 30, fontSize: 11 }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Social Proof & CTA Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={bannerSocialProofEnabled}
                              onChange={(e) => setBannerSocialProofEnabled(e.target.checked)}
                            />
                            Social Proof Footer
                          </label>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>{bannerSocialProofText.length}/32</span>
                        </div>
                        <input
                          type="text"
                          maxLength={32}
                          disabled={!bannerSocialProofEnabled}
                          value={bannerSocialProofText}
                          onChange={(e) => setBannerSocialProofText(e.target.value)}
                          placeholder="e.g. 36 founders created"
                          className="admin-input"
                          style={{ width: '100%', height: 36, fontSize: 13, opacity: bannerSocialProofEnabled ? 1 : 0.5 }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                            CTA Button Text
                          </label>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>{bannerCtaText.length}/20</span>
                        </div>
                        <input
                          type="text"
                          maxLength={20}
                          value={bannerCtaText}
                          onChange={(e) => setBannerCtaText(e.target.value)}
                          placeholder="e.g. Explore Now"
                          className="admin-input"
                          style={{ width: '100%', height: 36, fontSize: 13 }}
                        />
                      </div>
                    </div>

                    {/* 4. Theme Preset Swatches */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                        Visual Theme / Preset
                      </label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.values(BANNER_PRESETS).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setBannerPreset(p.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              borderRadius: 8,
                              border: '2px solid',
                              borderColor: bannerPreset === p.id ? '#2563EB' : '#E2E8F0',
                              background: bannerPreset === p.id ? '#EFF6FF' : '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: bannerPreset === p.id ? 700 : 500,
                              color: bannerPreset === p.id ? '#1D4ED8' : '#334155',
                            }}
                          >
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})`,
                                display: 'inline-block',
                              }}
                            />
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4.5. Custom Full Banner Background Image */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                        Full Banner Background Image (Custom Photo / Texture)
                      </label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                        <input
                          ref={bgFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBgImageUpload}
                          style={{ display: 'none' }}
                          id="banner-bg-file-input"
                        />
                        <label
                          htmlFor="banner-bg-file-input"
                          className="admin-btn admin-btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                          }}
                        >
                          <Upload size={14} />
                          {uploadingBgImage ? 'Uploading to R2...' : 'Upload Background Photo'}
                        </label>

                        {bannerBackground && (
                          <button
                            type="button"
                            onClick={() => setBannerBackground('')}
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: 11, padding: '6px 10px', color: '#DC2626' }}
                          >
                            Reset to Default Texture
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste background image URL (https://...)"
                        value={bannerBackground}
                        onChange={(e) => setBannerBackground(e.target.value)}
                        className="admin-input"
                        style={{ width: '100%', height: 34, fontSize: 12 }}
                      />
                      <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 4 }}>
                        Replaces the default blue card texture while preserving the gradient scrim for 100% text readability.
                      </span>
                    </div>

                    {/* 5. Custom Thumbnail Upload Controls */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                        Banner Thumbnail Image (86×104 Portrait)
                      </label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                          id="banner-file-input"
                        />
                        <label
                          htmlFor="banner-file-input"
                          className="admin-btn admin-btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                          }}
                        >
                          <Upload size={14} />
                          {uploadingImage ? 'Uploading to R2...' : 'Upload Custom Thumbnail'}
                        </label>

                        {selectedEntity?.imageUrl && (bannerThumbnail !== selectedEntity.imageUrl || formCustomImage !== selectedEntity.imageUrl) && (
                          <button
                            type="button"
                            onClick={() => {
                              setBannerThumbnail(selectedEntity.imageUrl);
                              setFormCustomImage(selectedEntity.imageUrl);
                            }}
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: 11, padding: '6px 10px' }}
                          >
                            Reset to Entity Logo
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 6. Navigation Destination Target */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                        Slide Click Navigation Destination
                      </label>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: '#1E293B', fontWeight: 600 }}>
                          <input
                            type="radio"
                            name="bannerTargetKind"
                            value="ENTITY"
                            checked={bannerTargetKind === 'ENTITY'}
                            onChange={() => setBannerTargetKind('ENTITY')}
                          />
                          Open Selected Entity ({selectedEntity?.type || 'Listing'})
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: '#1E293B', fontWeight: 600 }}>
                          <input
                            type="radio"
                            name="bannerTargetKind"
                            value="CUSTOM_LINK"
                            checked={bannerTargetKind === 'CUSTOM_LINK'}
                            onChange={() => setBannerTargetKind('CUSTOM_LINK')}
                          />
                          Custom In-App Deep Link or URL
                        </label>
                      </div>

                      {bannerTargetKind === 'CUSTOM_LINK' && (
                        <input
                          type="text"
                          maxLength={300}
                          placeholder="e.g. xindia://opportunity/explore_list?category=workwear or https://..."
                          value={bannerDeepLinkUrl}
                          onChange={(e) => setBannerDeepLinkUrl(e.target.value)}
                          className="admin-input"
                          style={{ width: '100%', height: 36, fontSize: 13 }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* KEYWORD PIN SPECIFIC FIELDS */}
              {formType === 'KEYWORD_PIN' && section !== 'BANNERS' && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                      Trigger Search Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. cotton t-shirt, apparel manufacturer, textiles"
                      value={formKeywords}
                      onChange={(e) => setFormKeywords(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', height: 38, fontSize: 13 }}
                      required
                    />
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                      When a buyer searches any of these keywords, this listing is pinned to the top.
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                      Search Result Slot Number
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[1, 2, 3].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormSlot(slot)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid',
                            borderColor: formSlot === slot ? '#2563EB' : '#CBD5E1',
                            background: formSlot === slot ? '#EFF6FF' : '#FFFFFF',
                            color: formSlot === slot ? '#1D4ED8' : '#475569',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          Slot #{slot} {slot === 1 ? '(Absolute Top)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* TRENDING BOOST SPECIFIC FIELDS */}
              {formType === 'TRENDING_BOOST' && section !== 'BANNERS' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    Trending Boost Priority Rank
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[1, 2, 3, 4, 5].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormPriority(p)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid',
                          borderColor: formPriority === p ? '#EA580C' : '#CBD5E1',
                          background: formPriority === p ? '#FFF7ED' : '#FFFFFF',
                          color: formPriority === p ? '#C2410C' : '#475569',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        #{p} {p === 1 ? '(Highest)' : ''}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    Rank #1 takes highest priority position at the top of the mobile app feed.
                  </div>
                </div>
              )}

              {/* BANNER SPECIFIC: CAROUSEL SLOT SELECTION */}
              {section === 'BANNERS' && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                      Carousel Slide Slot
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5, 6].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormSlot(s)}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: 8,
                            border: '1px solid',
                            borderColor: formSlot === s ? '#7C3AED' : '#CBD5E1',
                            background: formSlot === s ? '#F5F3FF' : '#FFFFFF',
                            color: formSlot === s ? '#7C3AED' : '#475569',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          #{s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Common Fields: Title, Duration, Audit Notes */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  Campaign Internal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diwali promotional push"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', height: 36, fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    Duration
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
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    Audit / Billing Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Agreement #XIN-2026"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%', height: 36, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Modal Actions */}
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
                  style={{ background: section === 'BANNERS' ? '#7C3AED' : '#E8581C' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Activating...' : section === 'BANNERS' ? 'Publish Banner Slide' : 'Activate Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {clearAllConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginBottom: 14 }}>
              <Power size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              Purge Active Overrides?
            </h3>
            <p style={{ margin: '8px 0 20px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              This will immediately deactivate all manual promotional overrides in this section.
              <br /><br />
              <strong>Natural Algorithmic Score will take over immediately.</strong> The true mathematical winners will automatically be placed at the top.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setClearAllConfirmOpen(false)}
                className="admin-btn admin-btn-secondary"
                disabled={actionLoading}
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="admin-btn admin-btn-danger"
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

export default function SpotlightPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading Spotlight Portal...</div>}>
      <SpotlightContent />
    </Suspense>
  );
}
