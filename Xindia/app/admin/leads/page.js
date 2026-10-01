'use strict';
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  X,
  Copy,
  Plus,
  Send,
  ExternalLink,
  Receipt,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  User,
  Info,
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import '../payments/payments.css';

const formatInr = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pending Quote', statusClass: 'PENDING', icon: Clock },
  DISPATCHED: { label: 'Invoice Sent', statusClass: 'DISPATCHED', icon: Send },
  PAID: { label: 'Paid & Fulfilled', statusClass: 'PAID', icon: CheckCircle2 },
  EXPIRED: { label: 'Expired', statusClass: 'EXPIRED', icon: XCircle },
  CANCELLED: { label: 'Cancelled', statusClass: 'CANCELLED', icon: XCircle },
};

const ITEM_TYPE_LABELS = {
  PLAN: { label: 'Corporate Membership Plan', icon: FileText, color: '#2563EB' },
  CREDITS: { label: 'SmartCredits Balance', icon: Zap, color: '#059669' },
  BOOST: { label: 'Lead Priority Boost', icon: Sparkles, color: '#D97706' },
  SPOTLIGHT: { label: 'Spotlight Feature', icon: Sparkles, color: '#7C3AED' },
  MISCELLANEOUS: { label: 'Custom B2B Order', icon: Receipt, color: '#475569' },
};

export default function AdminLeadsPage() {
  const { loaded, canManagePayments } = useAdminPermissions();

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Leads State
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPagination, setLeadsPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
  const [leadsSummary, setLeadsSummary] = useState({ PENDING: 0, DISPATCHED: 0, PAID: 0, EXPIRED: 0, CANCELLED: 0 });
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadsStatus, setLeadsStatus] = useState('ALL');
  const [leadsItemType, setLeadsItemType] = useState('ALL');

  // Automation State
  const [invoicingAutomation, setInvoicingAutomation] = useState({
    autoDispatchPlanInvoices: true,
    autoDispatchCreditInvoices: true,
  });
  const [togglingAutomation, setTogglingAutomation] = useState(false);
  const [dispatchingLeadId, setDispatchingLeadId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetailsModalOpen, setLeadDetailsModalOpen] = useState(false);

  // Custom Payment Link Modal States
  const [customLinkModalOpen, setCustomLinkModalOpen] = useState(false);
  const [sellerSearchInput, setSellerSearchInput] = useState('');
  const [sellerSearchResults, setSellerSearchResults] = useState([]);
  const [searchingSellers, setSearchingSellers] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const [customItemType, setCustomItemType] = useState('PLAN');
  const [customPlanKey, setCustomPlanKey] = useState('growth');
  const [customBillingCycle, setCustomBillingCycle] = useState('yearly');
  const [customCreditsCount, setCustomCreditsCount] = useState(100);
  const [customBoostTier, setCustomBoostTier] = useState('urgent');
  const [customRequirementId, setCustomRequirementId] = useState('');
  const [customItemTitle, setCustomItemTitle] = useState('');
  const [customItemDescription, setCustomItemDescription] = useState('');
  const [customBaseAmount, setCustomBaseAmount] = useState(5994);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [customIsInterState, setCustomIsInterState] = useState(false);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [customContactPerson, setCustomContactPerson] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customGstin, setCustomGstin] = useState('');
  const [customAdminNotes, setCustomAdminNotes] = useState('');
  const [customDispatchEmail, setCustomDispatchEmail] = useState(true);
  const [generatingCustomLink, setGeneratingCustomLink] = useState(false);
  const [createdCustomLinkResult, setCreatedCustomLinkResult] = useState(null);
  const sellerSearchTimeoutRef = useRef(null);

  // 1. Fetch Leads
  const fetchLeads = useCallback(async () => {
    try {
      setLeadsLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(leadsPagination.page));
      params.set('limit', String(leadsPagination.limit));
      if (leadsStatus !== 'ALL') params.set('status', leadsStatus);
      if (leadsItemType !== 'ALL') params.set('itemType', leadsItemType);
      if (leadsSearch.trim()) params.set('search', leadsSearch.trim());

      const res = await fetch(`/api/admin/payments/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
        setLeadsTotal(data.total || 0);
        setLeadsPagination((prev) => ({
          ...prev,
          totalPages: Math.max(1, Math.ceil((data.total || 0) / prev.limit)),
        }));
        if (data.summary) {
          setLeadsSummary(data.summary);
        }
      } else {
        showToast(data.message || 'Failed to fetch payment leads', 'error');
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      showToast('Network error fetching payment leads', 'error');
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsPagination.page, leadsPagination.limit, leadsSearch, leadsStatus, leadsItemType]);

  // 2. Fetch Automation Settings
  const fetchAutomation = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments/invoicing-automation');
      const data = await res.json();
      if (data.success && data.invoicingAutomation) {
        setInvoicingAutomation(data.invoicingAutomation);
      }
    } catch (err) {
      console.error('Failed to load automation settings:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (loaded && canManagePayments) {
      fetchAutomation();
      fetchLeads();
    }
  }, [loaded, canManagePayments, fetchAutomation, fetchLeads]);

  // Automation Toggle Handler
  const handleToggleAutomation = async (newValue) => {
    try {
      setTogglingAutomation(true);
      const res = await fetch('/api/admin/payments/invoicing-automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoDispatchPlanInvoices: newValue }),
      });
      const data = await res.json();
      if (data.success) {
        setInvoicingAutomation(data.invoicingAutomation);
        showToast(
          newValue
            ? '⚡ Invoicing Automation: Activated (Real-time Email & Razorpay dispatch)'
            : '⏳ Invoicing Automation: Paused (Incoming requests routed to manual queue)',
          'success'
        );
      } else {
        showToast(data.message || 'Failed to update automation', 'error');
      }
    } catch (err) {
      showToast('Error updating automation setting', 'error');
    } finally {
      setTogglingAutomation(false);
    }
  };

  // Dispatch Lead Invoice Link Handler
  const handleDispatchLead = async (lead) => {
    if (!lead?._id || dispatchingLeadId) return;
    try {
      setDispatchingLeadId(lead._id);
      const res = await fetch(`/api/admin/payments/leads/${lead._id}/dispatch`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Tax invoice & payment link dispatched to ${lead.email}!`, 'success');
        fetchLeads();
      } else {
        showToast(data.message || 'Failed to dispatch invoice link', 'error');
      }
    } catch (err) {
      showToast('Network error dispatching invoice link', 'error');
    } finally {
      setDispatchingLeadId(null);
    }
  };

  // Seller Autocomplete Search
  const handleSearchSellers = (query) => {
    setSellerSearchInput(query);
    if (sellerSearchTimeoutRef.current) clearTimeout(sellerSearchTimeoutRef.current);
    if (!query || query.trim().length < 2) {
      setSellerSearchResults([]);
      return;
    }

    sellerSearchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchingSellers(true);
        const res = await fetch(`/api/admin/payments/search-sellers?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSellerSearchResults(data.sellers || []);
        }
      } catch (err) {
        console.error('Failed to search sellers:', err);
      } finally {
        setSearchingSellers(false);
      }
    }, 280);
  };

  const handleSelectSeller = (seller) => {
    setSelectedSeller(seller);
    setSellerSearchResults([]);
    setSellerSearchInput('');
    setCustomCompanyName(seller.companyName || seller.name || '');
    setCustomContactPerson(seller.name || '');
    setCustomEmail(seller.email || '');
    setCustomPhone(seller.phone || '');
    setCustomGstin(seller.gstin || '');
  };

  const handleOpenCustomLinkModal = () => {
    setSelectedSeller(null);
    setSellerSearchInput('');
    setSellerSearchResults([]);
    setCustomItemType('PLAN');
    setCustomPlanKey('growth');
    setCustomBillingCycle('yearly');
    setCustomBaseAmount(5994);
    setCustomDiscount(0);
    setCustomCompanyName('');
    setCustomContactPerson('');
    setCustomEmail('');
    setCustomPhone('');
    setCustomGstin('');
    setCustomItemTitle('');
    setCustomItemDescription('');
    setCustomAdminNotes('');
    setCreatedCustomLinkResult(null);
    setCustomLinkModalOpen(true);
  };

  const handleExecuteCreateCustomLink = async () => {
    if (!selectedSeller && !customEmail.trim()) {
      showToast('Please select a seller or enter an email address', 'error');
      return;
    }
    if (!customEmail.trim()) {
      showToast('Recipient email is required', 'error');
      return;
    }
    if (Number(customBaseAmount) <= 0) {
      showToast('Base amount must be greater than zero', 'error');
      return;
    }

    try {
      setGeneratingCustomLink(true);
      const payload = {
        userId: selectedSeller?.id || selectedSeller?._id,
        itemType: customItemType,
        itemDetails: {
          planKey: customPlanKey,
          billingCycle: customBillingCycle,
          creditsCount: customCreditsCount,
          boostTier: customBoostTier,
          requirementId: customRequirementId.trim(),
          customTitle: customItemTitle.trim() || undefined,
          customDescription: customItemDescription.trim() || undefined,
        },
        amount: Number(customBaseAmount),
        discount: Number(customDiscount || 0),
        companyName: customCompanyName.trim(),
        contactPerson: customContactPerson.trim(),
        email: customEmail.trim(),
        phone: customPhone.trim(),
        gstin: customGstin.trim() || undefined,
        adminNotes: customAdminNotes.trim(),
        dispatchEmail: customDispatchEmail,
      };

      const res = await fetch('/api/admin/payments/create-custom-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedCustomLinkResult({
          paymentUrl: data.paymentUrl,
          leadNumber: data.leadNumber,
          invoiceNumber: data.invoiceNumber,
          finalAmount: data.finalAmount,
        });
        showToast('Bespoke Payment Link & Proforma Tax Invoice created!', 'success');
        fetchLeads();
      } else {
        showToast(data.message || 'Failed to generate custom link', 'error');
      }
    } catch (err) {
      showToast('Error generating custom payment link', 'error');
    } finally {
      setGeneratingCustomLink(false);
    }
  };

  if (!loaded) {
    return (
      <div className="payments-loading-container">
        <RefreshCw size={24} className="spin-icon" color="#E8581C" />
        <p>Loading Invoicing &amp; Leads Pipeline...</p>
      </div>
    );
  }

  if (!canManagePayments) {
    return (
      <div className="payments-unauthorized-card">
        <ShieldCheck size={48} color="#94A3B8" />
        <h2>Access Restricted</h2>
        <p>You do not have administrative permissions to view or manage corporate sales leads and invoices.</p>
      </div>
    );
  }

  return (
    <div className="payments-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`payments-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="payments-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="payments-title">Invoicing &amp; Sales Leads</h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#EFF6FF', color: '#1D4ED8' }}>
              B2B Sales Pipeline
            </span>
          </div>
          <p className="payments-subtitle">
            Manage enterprise proforma invoices, mobile app purchase inquiries, statutory 18% GST quotes, and custom Razorpay checkout links.
          </p>
        </div>

        <div className="payments-header-actions">
          <button
            onClick={fetchLeads}
            disabled={leadsLoading}
            className="payments-btn payments-btn-outline"
            title="Refresh Leads Table"
          >
            <RefreshCw size={15} className={leadsLoading ? 'spin-icon' : ''} />
            Refresh
          </button>
          <button
            onClick={handleOpenCustomLinkModal}
            className="payments-btn payments-btn-primary"
          >
            <Plus size={16} />
            Create Custom Link
          </button>
        </div>
      </div>

      {/* Automation Switch Banner */}
      <div className="automation-banner">
        <div className="automation-banner-info">
          <div
            className="automation-banner-icon"
            style={{
              background: invoicingAutomation?.autoDispatchPlanInvoices !== false ? '#DCFCE7' : '#FEF3C7',
              color: invoicingAutomation?.autoDispatchPlanInvoices !== false ? '#15803D' : '#D97706',
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <div className="automation-banner-title">
              <span>B2B Invoicing Automation:</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 9px',
                  borderRadius: 12,
                  background: invoicingAutomation?.autoDispatchPlanInvoices !== false ? '#DCFCE7' : '#FEF3C7',
                  color: invoicingAutomation?.autoDispatchPlanInvoices !== false ? '#166534' : '#B45309',
                }}
              >
                {invoicingAutomation?.autoDispatchPlanInvoices !== false ? '⚡ REAL-TIME AUTO-DISPATCH (ON)' : '⏳ MANUAL APPROVAL QUEUE (OFF)'}
              </span>
            </div>
            <p className="automation-banner-desc">
              {invoicingAutomation?.autoDispatchPlanInvoices !== false
                ? 'Incoming mobile app invoice requests are instantly converted to Razorpay links and dispatched to seller emails with statutory 18% GST calculation.'
                : 'Incoming mobile app requests appear in the queue below. Admins manually review quotes and dispatch invoices.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, cursor: 'pointer', flexShrink: 0 }}>
            <input
              type="checkbox"
              disabled={togglingAutomation}
              checked={invoicingAutomation?.autoDispatchPlanInvoices !== false}
              onChange={(e) => handleToggleAutomation(e.target.checked)}
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
                backgroundColor: invoicingAutomation?.autoDispatchPlanInvoices !== false ? '#10B981' : '#CBD5E1',
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
                  left: invoicingAutomation?.autoDispatchPlanInvoices !== false ? 24 : 3,
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

      {/* Leads Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search Lead Reference, Company Name, Contact Person, Email, Phone, GSTIN..."
            value={leadsSearch}
            onChange={(e) => { setLeadsSearch(e.target.value); setLeadsPagination((prev) => ({ ...prev, page: 1 })); }}
            className="payments-search-input"
            style={{ width: '100%', paddingLeft: 40, paddingRight: leadsSearch ? 36 : 14, height: 42, fontSize: 13, borderRadius: 8 }}
          />
          {leadsSearch && (
            <button
              onClick={() => { setLeadsSearch(''); setLeadsPagination((prev) => ({ ...prev, page: 1 })); }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Chips */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Lead Status
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All Leads (${leadsSummary.PENDING + leadsSummary.DISPATCHED + leadsSummary.PAID})` },
              { id: 'PENDING', label: `🟡 Pending Quote / Dispatch (${leadsSummary.PENDING})` },
              { id: 'DISPATCHED', label: `🔵 Invoice Sent (${leadsSummary.DISPATCHED})` },
              { id: 'PAID', label: `🟢 Settled & Fulfilled (${leadsSummary.PAID})` },
              { id: 'EXPIRED', label: '⚪ Expired' },
              { id: 'CANCELLED', label: '🔴 Cancelled' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => { setLeadsStatus(s.id); setLeadsPagination((prev) => ({ ...prev, page: 1 })); }}
                style={{
                  border: leadsStatus === s.id ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  background: leadsStatus === s.id ? '#0F172A' : '#FFFFFF',
                  color: leadsStatus === s.id ? '#FFFFFF' : '#475569',
                  fontSize: 11, fontWeight: leadsStatus === s.id ? 700 : 500,
                  padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Chips */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Service Category
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'PLAN', label: '💳 Seller Plans' },
              { id: 'CREDITS', label: '🪙 SmartCredits' },
              { id: 'BOOST', label: '⚡ Lead Boost' },
              { id: 'SPOTLIGHT', label: '✨ Spotlight Feature' },
              { id: 'MISCELLANEOUS', label: '📦 Custom Deals' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => { setLeadsItemType(c.id); setLeadsPagination((prev) => ({ ...prev, page: 1 })); }}
                style={{
                  border: leadsItemType === c.id ? '1px solid #E8581C' : '1px solid #E2E8F0',
                  background: leadsItemType === c.id ? '#FFF7ED' : '#FAFAFA',
                  color: leadsItemType === c.id ? '#C2410C' : '#64748B',
                  fontSize: 11, fontWeight: leadsItemType === c.id ? 700 : 500,
                  padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="payments-table-card">
        <div className="payments-table-responsive">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Lead Reference / Date</th>
                <th>Enterprise / Customer</th>
                <th>Requested Item &amp; Scope</th>
                <th>Valuation (INR)</th>
                <th>GST (18%)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leadsLoading && leads.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#94A3B8' }}>
                    <RefreshCw size={24} color="#E8581C" className="spin-icon" style={{ margin: '0 auto 8px auto' }} />
                    <div>Loading B2B payment leads...</div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#94A3B8' }}>
                    No payment leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((l) => {
                  const statusCfg = STATUS_CONFIG[l.status] || STATUS_CONFIG.PENDING;
                  const itemCfg = ITEM_TYPE_LABELS[l.itemType] || { label: l.itemType, icon: Receipt, color: '#64748B' };
                  const ItemIcon = itemCfg.icon;

                  return (
                    <tr key={l._id}>
                      {/* Lead Ref & Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="badge-invoice" style={{ background: '#F1F5F9', color: '#0F172A', borderColor: '#CBD5E1' }}>
                            {l.leadNumber}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(l.leadNumber);
                              showToast(`Copied ${l.leadNumber}`);
                            }}
                            className="payments-icon-btn"
                            title="Copy Lead Ref"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 3 }}>
                          {formatDate(l.createdAt)}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 3 }}>
                          {l.source === 'APP_INVOICE_REQUEST' ? 'Mobile App Request' : 'Admin Custom Quote'}
                        </span>
                      </td>

                      {/* Enterprise */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                          {l.companyName || l.contactPerson || 'Enterprise Lead'}
                        </div>
                        {l.contactPerson && l.companyName && (
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                            Rep: {l.contactPerson}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          {l.email} {l.phone ? `• ${l.phone}` : ''}
                        </div>
                        {l.gstin && (
                          <div style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#1E40AF', marginTop: 2 }}>
                            GSTIN: {l.gstin}
                          </div>
                        )}
                      </td>

                      {/* Scope */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ItemIcon size={14} color={itemCfg.color} />
                          <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>
                            {l.itemType === 'PLAN'
                              ? `${(l.itemDetails?.planKey || 'Enterprise').toUpperCase()} PLAN`
                              : l.itemType === 'CREDITS'
                                ? `${l.itemDetails?.creditsCount || 100} SmartCredits`
                                : l.itemType === 'BOOST'
                                  ? `${(l.itemDetails?.boostTier || 'Priority').toUpperCase()} Boost`
                                  : l.itemDetails?.customTitle || 'Bespoke Package'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          {l.itemType === 'PLAN' ? `Billing: ${l.itemDetails?.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}` : 'One-time Payment'}
                        </div>
                        {l.invoiceNumber && (
                          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 2 }}>
                            Invoice: {l.invoiceNumber}
                          </div>
                        )}
                      </td>

                      {/* Valuation */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>
                          {formatInr(l.finalAmount)}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                          Base: {formatInr(l.baseAmount)}
                        </div>
                      </td>

                      {/* Tax */}
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                          {formatInr(l.tax?.totalTax || 0)}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#94A3B8' }}>
                          {l.tax?.isInterState ? 'IGST (18%)' : 'CGST+SGST (9%+9%)'}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`payments-badge ${statusCfg.statusClass}`}>
                          <statusCfg.icon size={12} />
                          {statusCfg.label}
                        </span>
                        {l.dispatchedAt && (
                          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 3 }}>
                            Sent: {formatDate(l.dispatchedAt)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {l.status === 'PENDING' && (
                            <button
                              onClick={() => handleDispatchLead(l)}
                              disabled={dispatchingLeadId === l._id}
                              className="payments-btn payments-btn-primary"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              title="Dispatch Razorpay link & Invoice email"
                            >
                              {dispatchingLeadId === l._id ? (
                                <RefreshCw size={13} className="spin-icon" />
                              ) : (
                                <Send size={13} />
                              )}
                              Dispatch
                            </button>
                          )}

                          {l.paymentUrl && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(l.paymentUrl);
                                showToast('Copied Payment Link to clipboard!');
                              }}
                              className="payments-btn payments-btn-outline"
                              style={{ padding: '6px 10px', fontSize: 12 }}
                              title="Copy Payment Link"
                            >
                              <Copy size={13} />
                              Link
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedLead(l);
                              setLeadDetailsModalOpen(true);
                            }}
                            className="payments-icon-btn"
                            title="View Full Lead Details"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {leadsPagination.totalPages > 1 && (
          <div className="payments-pagination">
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Showing {leads.length} of {leadsTotal} payment leads
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                disabled={leadsPagination.page <= 1}
                onClick={() => setLeadsPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="payments-icon-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '0 8px' }}>
                Page {leadsPagination.page} of {leadsPagination.totalPages}
              </span>
              <button
                disabled={leadsPagination.page >= leadsPagination.totalPages}
                onClick={() => setLeadsPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="payments-icon-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Details Modal */}
      {leadDetailsModalOpen && selectedLead && (
        <div className="payments-modal-overlay">
          <div className="payments-modal-card" style={{ maxWidth: 640 }}>
            <div className="payments-modal-header">
              <div>
                <h3 className="payments-modal-title">Proforma Lead Details</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Ref: {selectedLead.leadNumber} • Created {formatDate(selectedLead.createdAt)}
                </div>
              </div>
              <button onClick={() => setLeadDetailsModalOpen(false)} className="payments-icon-btn">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Company Info Box */}
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 6 }}>
                  {selectedLead.companyName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12, color: '#475569' }}>
                  <div><strong>Contact Person:</strong> {selectedLead.contactPerson}</div>
                  <div><strong>Email:</strong> {selectedLead.email}</div>
                  <div><strong>Phone:</strong> {selectedLead.phone || '—'}</div>
                  <div><strong>GSTIN:</strong> {selectedLead.gstin || 'Unregistered'}</div>
                </div>
              </div>

              {/* Tax & Financials Box */}
              <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 8 }}>
                  Statutory 18% GST Valuation
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Base Taxable Valuation:</span>
                    <span>{formatInr(selectedLead.baseAmount)}</span>
                  </div>
                  {selectedLead.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                      <span>Promotional Discount:</span>
                      <span>- {formatInr(selectedLead.discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Net Taxable Base:</span>
                    <span>{formatInr(selectedLead.netAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                    <span>
                      {selectedLead.tax?.isInterState ? 'IGST (18%)' : 'CGST (9%) + SGST (9%)'}:
                    </span>
                    <span>{formatInr(selectedLead.tax?.totalTax || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: '#0F172A', borderTop: '1px dashed #CBD5E1', paddingTop: 8 }}>
                    <span>Total Payable Amount:</span>
                    <span style={{ color: '#E8581C' }}>{formatInr(selectedLead.finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Link details */}
              {selectedLead.paymentUrl && (
                <div style={{ background: '#EFF6FF', padding: 14, borderRadius: 8, border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#1E40AF' }}>
                      Active Razorpay Payment Link
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLead.paymentUrl);
                        showToast('Copied Payment Link!');
                      }}
                      className="payments-btn payments-btn-outline"
                      style={{ padding: '3px 8px', fontSize: 11 }}
                    >
                      <Copy size={12} />
                      Copy Link
                    </button>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#1D4ED8', wordBreak: 'break-all' }}>
                    {selectedLead.paymentUrl}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setLeadDetailsModalOpen(false)} className="payments-btn payments-btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Payment Link Modal */}
      {customLinkModalOpen && (
        <div className="payments-modal-overlay">
          <div className="payments-modal-card" style={{ maxWidth: 680 }}>
            <div className="payments-modal-header">
              <div>
                <h3 className="payments-modal-title">Create Bespoke B2B Payment Link</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Generate an instant Proforma Tax Invoice and Razorpay payment link for custom contracts.
                </div>
              </div>
              <button onClick={() => setCustomLinkModalOpen(false)} className="payments-icon-btn">
                <X size={18} />
              </button>
            </div>

            {createdCustomLinkResult ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  Payment Link &amp; Proforma Invoice Ready!
                </h4>
                <p style={{ fontSize: 13, color: '#64748B', maxWidth: 440, margin: '0 auto 20px auto' }}>
                  Invoice #{createdCustomLinkResult.invoiceNumber} has been generated for {formatInr(createdCustomLinkResult.finalAmount)}.
                </p>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>SHAREABLE PAYMENT LINK:</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#0F172A', wordBreak: 'break-all' }}>
                    {createdCustomLinkResult.paymentUrl}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdCustomLinkResult.paymentUrl);
                      showToast('Copied payment link to clipboard!');
                    }}
                    className="payments-btn payments-btn-primary"
                  >
                    <Copy size={14} />
                    Copy Link
                  </button>
                  <button
                    onClick={() => setCustomLinkModalOpen(false)}
                    className="payments-btn payments-btn-outline"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Search Seller / Enter Info */}
                <div>
                  <label className="payments-form-label">Search Registered Seller (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Type name, email, company or phone..."
                      value={sellerSearchInput}
                      onChange={(e) => handleSearchSellers(e.target.value)}
                      className="payments-input"
                      style={{ paddingLeft: 36 }}
                    />
                    {searchingSellers && (
                      <RefreshCw size={14} className="spin-icon" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#E8581C' }} />
                    )}
                  </div>

                  {sellerSearchResults.length > 0 && (
                    <div className="seller-search-dropdown">
                      {sellerSearchResults.map((s) => (
                        <div
                          key={s._id}
                          onClick={() => handleSelectSeller(s)}
                          className="seller-search-item"
                        >
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{s.companyName || s.name}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>{s.email} • {s.phone || 'No phone'}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSeller && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>
                        Selected: {selectedSeller.companyName || selectedSeller.name} ({selectedSeller.email})
                      </span>
                      <button
                        onClick={() => setSelectedSeller(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#065F46' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Scope selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div>
                    <label className="payments-form-label">Service Type</label>
                    <select
                      value={customItemType}
                      onChange={(e) => setCustomItemType(e.target.value)}
                      className="payments-select"
                    >
                      <option value="PLAN">Corporate Seller Plan</option>
                      <option value="CREDITS">SmartCredits Package</option>
                      <option value="BOOST">Lead Boost Priority</option>
                      <option value="SPOTLIGHT">Spotlight Showcase</option>
                      <option value="MISCELLANEOUS">Custom Deal / Other</option>
                    </select>
                  </div>

                  {customItemType === 'PLAN' ? (
                    <div>
                      <label className="payments-form-label">Plan Tier</label>
                      <select
                        value={customPlanKey}
                        onChange={(e) => {
                          setCustomPlanKey(e.target.value);
                          if (e.target.value === 'growth') setCustomBaseAmount(customBillingCycle === 'yearly' ? 11994 : 1999);
                          else if (e.target.value === 'pro') setCustomBaseAmount(customBillingCycle === 'yearly' ? 26994 : 4499);
                          else setCustomBaseAmount(customBillingCycle === 'yearly' ? 5994 : 999);
                        }}
                        className="payments-select"
                      >
                        <option value="basic">Basic Plan</option>
                        <option value="growth">Growth Plan</option>
                        <option value="pro">Pro Plan</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="payments-form-label">Custom Item Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Enterprise Machinery Listing Package"
                        value={customItemTitle}
                        onChange={(e) => setCustomItemTitle(e.target.value)}
                        className="payments-input"
                      />
                    </div>
                  )}
                </div>

                {/* Amount & Discount */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div>
                    <label className="payments-form-label">Base Taxable Amount (INR)</label>
                    <input
                      type="number"
                      value={customBaseAmount}
                      onChange={(e) => setCustomBaseAmount(e.target.value)}
                      className="payments-input"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="payments-form-label">Discount (INR, Optional)</label>
                    <input
                      type="number"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      className="payments-input"
                      min="0"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div>
                    <label className="payments-form-label">Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Precision Tools Ltd"
                      value={customCompanyName}
                      onChange={(e) => setCustomCompanyName(e.target.value)}
                      className="payments-input"
                    />
                  </div>
                  <div>
                    <label className="payments-form-label">Contact Person *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={customContactPerson}
                      onChange={(e) => setCustomContactPerson(e.target.value)}
                      className="payments-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <label className="payments-form-label">Email Address *</label>
                    <input
                      type="email"
                      placeholder="seller@enterprise.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="payments-input"
                    />
                  </div>
                  <div>
                    <label className="payments-form-label">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="payments-input"
                    />
                  </div>
                  <div>
                    <label className="payments-form-label">GSTIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="07AAAAA0000A1Z5"
                      value={customGstin}
                      onChange={(e) => setCustomGstin(e.target.value.toUpperCase())}
                      className="payments-input"
                    />
                  </div>
                </div>

                {/* Email dispatch checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="leadsDispatchEmail"
                    checked={customDispatchEmail}
                    onChange={(e) => setCustomDispatchEmail(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="leadsDispatchEmail" style={{ fontSize: 12, color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                    Dispatch payment link and Proforma Invoice directly to seller email
                  </label>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  <button
                    disabled={generatingCustomLink}
                    onClick={() => setCustomLinkModalOpen(false)}
                    className="payments-btn payments-btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={generatingCustomLink}
                    onClick={handleExecuteCreateCustomLink}
                    className="payments-btn payments-btn-primary"
                  >
                    {generatingCustomLink ? (
                      <>
                        <RefreshCw size={14} className="spin-icon" />
                        Generating Link...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Generate &amp; Dispatch
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
