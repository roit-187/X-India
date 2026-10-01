'use strict';
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Receipt,
  Download,
  Search,
  RefreshCw,
  Eye,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Coins,
  CreditCard,
  Zap,
  X,
  FileSpreadsheet,
  Copy,
  Printer,
  Plus,
  Send,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import './payments.css';

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
  PAID: { label: 'Paid', statusClass: 'PAID', icon: CheckCircle2 },
  CREATED: { label: 'Created', statusClass: 'CREATED', icon: Clock },
  FAILED: { label: 'Failed', statusClass: 'FAILED', icon: XCircle },
  REFUND_PENDING: { label: 'Refund Pending', statusClass: 'REFUND_PENDING', icon: AlertTriangle },
  REFUNDED: { label: 'Refunded', statusClass: 'REFUNDED', icon: RotateCcw },
  DISPUTED: { label: 'Disputed', statusClass: 'DISPUTED', icon: ShieldAlert },
  PENDING: { label: 'Pending Quote', statusClass: 'PENDING', icon: Clock },
  DISPATCHED: { label: 'Invoice Sent', statusClass: 'DISPATCHED', icon: Send },
  EXPIRED: { label: 'Expired', statusClass: 'EXPIRED', icon: XCircle },
  CANCELLED: { label: 'Cancelled', statusClass: 'CANCELLED', icon: XCircle },
};

const ITEM_TYPE_LABELS = {
  CREDIT_BUNDLE: { label: 'SmartCredits', icon: Coins, color: '#D97706' },
  SELLER_SUBSCRIPTION: { label: 'Seller Plan', icon: CreditCard, color: '#2563EB' },
  LEAD_BOOST: { label: 'RFQ Lead Boost', icon: Zap, color: '#EA580C' },
  PLAN: { label: 'Seller Plan', icon: CreditCard, color: '#2563EB' },
  CREDITS: { label: 'SmartCredits', icon: Coins, color: '#D97706' },
  BOOST: { label: 'RFQ Lead Boost', icon: Zap, color: '#EA580C' },
  SPOTLIGHT: { label: 'Spotlight Banner', icon: Sparkles, color: '#8B5CF6' },
  MISCELLANEOUS: { label: 'Custom B2B Deal', icon: Receipt, color: '#059669' },
};

export default function AdminPaymentsPage() {
  const { canManagePayments, loaded } = useAdminPermissions();

  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({
    totalGrossRevenue: 0,
    totalGstCollected: 0,
    paidTransactions: 0,
    totalRefundedAmount: 0,
    pendingRefundsCount: 0,
    disputedCount: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter States for Payment Ledger
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'seller' | 'buyer' | 'refunds' | 'pending' | 'leads'
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [itemType, setItemType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState('ALL');

  // Leads & Out-of-Band Invoicing States
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsPagination, setLeadsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [leadsSummary, setLeadsSummary] = useState({ PENDING: 0, DISPATCHED: 0, PAID: 0, EXPIRED: 0, CANCELLED: 0 });
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadsStatus, setLeadsStatus] = useState('ALL');
  const [leadsItemType, setLeadsItemType] = useState('ALL');
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

  const [customItemType, setCustomItemType] = useState('PLAN'); // 'PLAN' | 'CREDITS' | 'BOOST' | 'MISCELLANEOUS'
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

  // Payment Details & Refund Modals
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [refundModalPayment, setRefundModalPayment] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer requested refund');
  const [revokeBenefit, setRevokeBenefit] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'TODAY') {
      const today = now.toISOString().split('T')[0];
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDateFrom(yest);
      setDateTo(yest);
    } else if (preset === 'LAST_7_DAYS') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDateFrom(start);
      setDateTo('');
    } else if (preset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setDateFrom(start);
      setDateTo('');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // 1. Fetch Ledger Payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page);
      params.set('limit', pagination.limit);
      if (activeTab !== 'all' && activeTab !== 'leads') params.set('tab', activeTab);
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'ALL') params.set('status', status);
      if (itemType !== 'ALL') params.set('itemType', itemType);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setPayments(data.payments || []);
        setMetrics(data.metrics || {});
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      } else {
        showToast(data.message || 'Failed to fetch payments', 'error');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      showToast('Network error fetching payment records', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, activeTab, search, status, itemType, dateFrom, dateTo]);

  // 2. Fetch Payment Leads
  const fetchLeads = useCallback(async () => {
    try {
      setLeadsLoading(true);
      const params = new URLSearchParams();
      params.set('page', leadsPagination.page);
      params.set('limit', leadsPagination.limit);
      if (leadsSearch.trim()) params.set('search', leadsSearch.trim());
      if (leadsStatus !== 'ALL') params.set('status', leadsStatus);
      if (leadsItemType !== 'ALL') params.set('itemType', leadsItemType);

      const res = await fetch(`/api/admin/payments/leads?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLeads(data.leads || []);
        setLeadsPagination({
          page: data.page || 1,
          limit: 20,
          total: data.total || 0,
          totalPages: data.totalPages || 1,
        });
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

  // 3. Fetch Automation Settings
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
      // Fetch initial leads summary for tab badge
      fetch('/api/admin/payments/leads?limit=1')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.summary) setLeadsSummary(d.summary);
        })
        .catch(() => {});
    }
  }, [loaded, canManagePayments, fetchAutomation]);

  useEffect(() => {
    if (loaded && canManagePayments) {
      if (activeTab === 'leads') {
        fetchLeads();
      } else {
        fetchPayments();
      }
    }
  }, [loaded, canManagePayments, activeTab, fetchPayments, fetchLeads]);

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
        showToast(data.message || 'Invoice and payment link dispatched successfully!', 'success');
        fetchLeads();
        if (selectedLead && selectedLead._id === lead._id) {
          setSelectedLead({ ...selectedLead, status: 'DISPATCHED', invoiceNumber: data.invoiceNumber, paymentLinkUrl: data.paymentUrl });
        }
      } else {
        showToast(data.message || 'Failed to dispatch invoice', 'error');
      }
    } catch (err) {
      showToast('Network error dispatching invoice', 'error');
    } finally {
      setDispatchingLeadId(null);
    }
  };

  // Auto-pricing logic when modal parameters change
  useEffect(() => {
    if (customItemType === 'PLAN') {
      const planPrices = {
        basic: { monthly: 999, yearly: 5994 },
        growth: { monthly: 1999, yearly: 11994 },
        pro: { monthly: 4499, yearly: 26994 },
      };
      const p = planPrices[customPlanKey] || planPrices.growth;
      setCustomBaseAmount(customBillingCycle === 'yearly' ? p.yearly : p.monthly);
    } else if (customItemType === 'CREDITS') {
      const creditRates = { 50: 499, 100: 899, 250: 1999, 500: 3499 };
      setCustomBaseAmount(creditRates[customCreditsCount] || customCreditsCount * 10);
    } else if (customItemType === 'BOOST') {
      const boostRates = { urgent: 1499, high: 999, standard: 499 };
      setCustomBaseAmount(boostRates[customBoostTier] || 1499);
    } else if (customItemType === 'MISCELLANEOUS') {
      if (!customBaseAmount || customBaseAmount < 500) {
        setCustomBaseAmount(5000);
      }
    }
  }, [customItemType, customPlanKey, customBillingCycle, customCreditsCount, customBoostTier]);

  // Seller search in modal with debounce
  const handleSellerSearchChange = (query) => {
    setSellerSearchInput(query);
    if (sellerSearchTimeoutRef.current) clearTimeout(sellerSearchTimeoutRef.current);
    if (!query || query.trim().length < 2) {
      setSellerSearchResults([]);
      return;
    }
    setSearchingSellers(true);
    sellerSearchTimeoutRef.current = setTimeout(async () => {
      try {
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
        showToast('Payment link & invoice generated successfully!', 'success');
        if (activeTab === 'leads') {
          fetchLeads();
        }
      } else {
        showToast(data.message || 'Failed to create payment link', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Network error creating payment link', 'error');
    } finally {
      setGeneratingCustomLink(false);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'ALL') params.set('status', status);
    if (itemType !== 'ALL') params.set('itemType', itemType);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    window.open(`/api/admin/payments/export/csv?${params.toString()}`, '_blank');
  };

  const handleOpenDetails = async (payment) => {
    try {
      const res = await fetch(`/api/admin/payments/${payment._id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedPayment(data);
      } else {
        setSelectedPayment({ payment });
      }
      setDetailsModalOpen(true);
    } catch {
      setSelectedPayment({ payment });
      setDetailsModalOpen(true);
    }
  };

  const handleExecuteRefund = async () => {
    if (!refundModalPayment) return;
    try {
      setRefunding(true);
      const res = await fetch(`/api/admin/payments/${refundModalPayment._id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
          revokeBenefit,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Refund successfully executed', 'success');
        setRefundModalPayment(null);
        fetchPayments();
      } else {
        showToast(data.message || 'Failed to execute refund', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error executing refund', 'error');
    } finally {
      setRefunding(false);
    }
  };

  const handleSyncGateway = async (payment) => {
    if (!payment?._id || syncingId) return;
    try {
      setSyncingId(payment._id);
      const res = await fetch(`/api/admin/payments/${payment._id}/sync-gateway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Payment successfully synchronized with gateway', 'success');
        fetchPayments();
        if (selectedPayment && selectedPayment.payment?._id === payment._id) {
          handleOpenDetails(payment);
        }
      } else {
        showToast(data.message || 'Failed to sync with gateway', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error syncing with gateway', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  if (loaded && !canManagePayments) {
    return (
      <div className="payments-restricted">
        <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>Access Restricted</h2>
        <p style={{ fontSize: 13, color: '#64748B', maxWidth: 420, margin: 0 }}>
          You do not have administrative permissions to inspect payments or financial ledgers. Contact your Super Admin for access.
        </p>
      </div>
    );
  }

  // Calculated breakdown values for custom modal
  const calcBase = Math.max(0, Number(customBaseAmount || 0));
  const calcDiscount = Math.max(0, Number(customDiscount || 0));
  const calcNet = Math.max(0, calcBase - calcDiscount);
  const calcGst = Math.round(calcNet * 0.18);
  const calcFinal = calcNet + calcGst;

  return (
    <div className="payments-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`payments-toast ${toastMessage.type === 'error' ? 'error' : 'success'}`}>
          {toastMessage.msg}
        </div>
      )}

      {/* Header */}
      <div className="payments-header">
        <div className="payments-title-group">
          <h1>
            <Receipt size={26} color="#E8581C" />
            Payments &amp; Financial Ledger
          </h1>
          <p>
            Multi-channel revenue ledger, GST SAC 998439 compliance, and automated full-refund guarantees.
          </p>
        </div>

        <div className="payments-header-actions">
          <button
            onClick={handleOpenCustomLinkModal}
            className="payments-btn payments-btn-primary"
          >
            <Plus size={15} />
            Create Custom Payment Link
          </button>
          <button
            onClick={activeTab === 'leads' ? fetchLeads : fetchPayments}
            className="payments-btn payments-btn-outline"
          >
            <RefreshCw size={15} className={(loading || leadsLoading) ? 'spin-icon' : ''} />
            Refresh
          </button>
          <button onClick={handleExportCsv} className="payments-btn payments-btn-outline">
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="payments-metrics-grid">
        {/* Gross Revenue */}
        <div className="payments-metric-card">
          <div className="payments-metric-header">
            <span className="payments-metric-label">Gross Revenue</span>
            <div className="payments-metric-icon-wrap green">
              <Receipt size={18} />
            </div>
          </div>
          <div className="payments-metric-value">
            {formatInr(metrics.totalGrossRevenue)}
          </div>
          <div className="payments-metric-footer">
            <span>Seller: <strong style={{ color: '#0F172A' }}>{formatInr(metrics.sellerRevenue || 0)}</strong></span>
            <span>•</span>
            <span>Buyer: <strong style={{ color: '#0F172A' }}>{formatInr(metrics.buyerRevenue || 0)}</strong></span>
          </div>
        </div>

        {/* Total GST Collected */}
        <div className="payments-metric-card">
          <div className="payments-metric-header">
            <span className="payments-metric-label">Total GST (18%)</span>
            <div className="payments-metric-icon-wrap blue">
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <div className="payments-metric-value">
            {formatInr(metrics.totalGstCollected)}
          </div>
          <div className="payments-metric-footer">
            SAC: 998439 (CGST: {formatInr(metrics.cgstTotal)}, SGST: {formatInr(metrics.sgstTotal)})
          </div>
        </div>

        {/* Total Refunded */}
        <div className="payments-metric-card">
          <div className="payments-metric-header">
            <span className="payments-metric-label">Refunds Given</span>
            <div className="payments-metric-icon-wrap sky">
              <RotateCcw size={18} />
            </div>
          </div>
          <div className="payments-metric-value">
            {formatInr(metrics.totalRefundedAmount)}
          </div>
          <div className="payments-metric-footer" style={{ color: '#059669', fontWeight: 600 }}>
            100% full return guarantee (0% deduction)
          </div>
        </div>

        {/* Issues & Pending */}
        <div className="payments-metric-card">
          <div className="payments-metric-header">
            <span className="payments-metric-label">Pending Actions</span>
            <div className="payments-metric-icon-wrap amber">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="payments-metric-value" style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span>{metrics.pendingRefundsCount || 0}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706' }}>Pending Refunds</span>
          </div>
          <div className="payments-metric-footer">
            Disputed chargebacks: <strong style={{ color: '#DC2626' }}>{metrics.disputedCount || 0}</strong>
          </div>
        </div>
      </div>

      {/* Segregated Tab Switcher */}
      <div className="payments-tabs">
        {[
          { id: 'leads', label: 'B2B Leads & Custom Quotes', badge: leadsSummary?.PENDING || 0 },
          { id: 'all', label: 'All Transactions' },
          { id: 'seller', label: 'Seller Payments (Plans & Credits)' },
          { id: 'buyer', label: 'Buyer Payments (Lead Boosts)' },
          { id: 'refunds', label: 'Refunds & Disputes' },
          { id: 'pending', label: 'Pending Resolution Queue', badge: metrics.pendingRefundsCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== 'leads') {
                setPagination((prev) => ({ ...prev, page: 1 }));
              }
            }}
            className={`payments-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span className="payments-tab-badge">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: B2B PAYMENT LEADS & CUSTOM QUOTES VIEW
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leads' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                    ? 'Incoming mobile app invoice requests are instantly converted to Razorpay links and dispatched to seller emails with 18% GST calculation.'
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

              <button
                onClick={handleOpenCustomLinkModal}
                className="payments-btn payments-btn-primary"
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                <Plus size={15} />
                Create Custom Link
              </button>
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
                                GST: {l.gstin}
                              </div>
                            )}
                          </td>

                          {/* Item & Scope */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0F172A' }}>
                              <ItemIcon size={16} color={itemCfg.color} />
                              {itemCfg.label}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                              {l.itemType === 'PLAN' ? `${(l.itemDetails?.planKey || 'growth').toUpperCase()} Plan (${l.itemDetails?.billingCycle || 'yearly'})` :
                               l.itemType === 'CREDITS' ? `${l.itemDetails?.creditsCount || 100} SmartCredits` :
                               l.itemType === 'BOOST' ? `Lead Boost (${l.itemDetails?.boostTier || 'urgent'})` :
                               l.itemDetails?.customTitle || 'Custom Commercial Package'}
                            </div>
                            {l.invoiceNumber && (
                              <div style={{ fontSize: 10.5, color: '#1D4ED8', marginTop: 2, fontWeight: 600 }}>
                                Inv: #{l.invoiceNumber}
                              </div>
                            )}
                          </td>

                          {/* Amount */}
                          <td>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                              {formatInr(l.finalAmount)}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                              Base: {formatInr(l.netAmount)}
                            </div>
                          </td>

                          {/* GST */}
                          <td>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                              {formatInr(l.tax?.totalTax)}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>18% ITC</div>
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`badge-status ${statusCfg.statusClass}`}>
                              <statusCfg.icon size={13} />
                              {statusCfg.label}
                            </span>
                            {l.expiresAt && l.status === 'DISPATCHED' && (
                              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                                Valid: {formatDate(l.expiresAt)}
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

                              {l.paymentLinkUrl && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(l.paymentLinkUrl);
                                    showToast('Copied Payment Link to clipboard!');
                                  }}
                                  className="payments-icon-btn"
                                  title="Copy Live Payment Link"
                                  style={{ color: '#2563EB' }}
                                >
                                  <Copy size={16} />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedLead(l);
                                  setLeadDetailsModalOpen(true);
                                }}
                                className="payments-icon-btn"
                                title="Inspect Lead Details"
                              >
                                <Eye size={16} />
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

            {/* Pagination Strip */}
            <div className="payments-pagination">
              <span>
                Showing Page {leadsPagination.page} of {leadsPagination.totalPages} ({leadsPagination.total} total leads)
              </span>

              <div className="payments-pagination-btns">
                <button
                  disabled={leadsPagination.page <= 1}
                  onClick={() => setLeadsPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="payments-page-btn"
                >
                  Previous
                </button>
                <button
                  disabled={leadsPagination.page >= leadsPagination.totalPages}
                  onClick={() => setLeadsPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="payments-page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            TAB 2+: FINANCIAL LEDGER TRANSACTIONS VIEW
        ───────────────────────────────────────────────────────────── */
        <div>
          {/* Filter & Search Bar with Interactive Chips */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search Order ID, Payment ID, Customer Email, Business Name, Phone, Promo..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
                className="payments-search-input"
                style={{ width: '100%', paddingLeft: 40, paddingRight: search ? 36 : 14, height: 42, fontSize: 13, borderRadius: 8 }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setPagination((prev) => ({ ...prev, page: 1 })); }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Payment Status
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'All Statuses' },
                  { id: 'PAID', label: '🟢 Paid' },
                  { id: 'CREATED', label: '🟡 In-Flight (Created)' },
                  { id: 'FAILED', label: '🔴 Failed' },
                  { id: 'REFUND_PENDING', label: '🟠 Refund Pending' },
                  { id: 'REFUNDED', label: '🟣 Refunded' },
                  { id: 'DISPUTED', label: '⚠️ Disputed' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStatus(s.id); setPagination((prev) => ({ ...prev, page: 1 })); }}
                    style={{
                      border: status === s.id ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      background: status === s.id ? '#0F172A' : '#FFFFFF',
                      color: status === s.id ? '#FFFFFF' : '#475569',
                      fontSize: 11, fontWeight: status === s.id ? 700 : 500,
                      padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenue Channel Filter Chips */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Revenue Channel
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'All Channels' },
                  { id: 'CREDIT_BUNDLE', label: '🪙 SmartCredits' },
                  { id: 'SELLER_SUBSCRIPTION', label: '💳 Seller Plans' },
                  { id: 'LEAD_BOOST', label: '⚡ RFQ Lead Boost' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setItemType(c.id); setPagination((prev) => ({ ...prev, page: 1 })); }}
                    style={{
                      border: itemType === c.id ? '1px solid #E8581C' : '1px solid #E2E8F0',
                      background: itemType === c.id ? '#FFF7ED' : '#FAFAFA',
                      color: itemType === c.id ? '#C2410C' : '#64748B',
                      fontSize: 11, fontWeight: itemType === c.id ? 700 : 500,
                      padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Date Horizon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginRight: 4 }}>Date Horizon:</span>
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: 'TODAY', label: 'Today' },
                  { id: 'YESTERDAY', label: 'Yesterday' },
                  { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                  { id: 'THIS_MONTH', label: 'This Month' },
                  { id: 'CUSTOM', label: 'Custom Range...' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDatePreset(d.id)}
                    style={{
                      border: datePreset === d.id ? '1px solid #2563EB' : '1px solid #E2E8F0',
                      background: datePreset === d.id ? '#EFF6FF' : '#FFFFFF',
                      color: datePreset === d.id ? '#1D4ED8' : '#64748B',
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, cursor: 'pointer',
                    }}
                  >
                    {d.label}
                  </button>
                ))}

                {datePreset === 'CUSTOM' && (
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginLeft: 6 }}>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
                      className="payments-date-input"
                      style={{ height: 28, fontSize: 11, padding: '0 6px' }}
                    />
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>to</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
                      className="payments-date-input"
                      style={{ height: 28, fontSize: 11, padding: '0 6px' }}
                    />
                  </div>
                )}
              </div>

              {(search || status !== 'ALL' || itemType !== 'ALL' || datePreset !== 'ALL' || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatus('ALL');
                    setItemType('ALL');
                    setDatePreset('ALL');
                    setDateFrom('');
                    setDateTo('');
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  style={{
                    border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B',
                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="payments-table-card">
            <div className="payments-table-responsive">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Invoice / Order ID</th>
                    <th>Customer &amp; Role</th>
                    <th>Channel / Item</th>
                    <th>Amount (INR)</th>
                    <th>GST (18%)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && payments.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#94A3B8' }}>
                        <RefreshCw size={24} color="#E8581C" className="spin-icon" style={{ margin: '0 auto 8px auto' }} />
                        <div>Loading payment records...</div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '48px 0', textAlign: 'center', color: '#94A3B8' }}>
                        No payment records match your filters.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.CREATED;
                      const itemCfg = ITEM_TYPE_LABELS[p.itemType] || { label: p.itemType, icon: Receipt, color: '#64748B' };
                      const ItemIcon = itemCfg.icon;
                      const role = (p.payerRole || (p.itemType === 'LEAD_BOOST' ? 'buyer' : 'seller')).toLowerCase();

                      return (
                        <tr key={p._id}>
                          {/* Invoice & Order ID */}
                          <td>
                            {p.invoiceNumber ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="badge-invoice">{p.invoiceNumber}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.invoiceNumber);
                                    showToast(`Copied ${p.invoiceNumber}`);
                                  }}
                                  className="payments-icon-btn"
                                  title="Copy Invoice #"
                                >
                                  <Copy size={13} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                                {p.orderId}
                              </div>
                            )}
                            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 3 }}>{formatDate(p.createdAt)}</div>
                            {p.paymentId && (
                              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B', marginTop: 2 }}>PayID: {p.paymentId}</div>
                            )}
                          </td>

                          {/* Customer & Role */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span className={`badge-role ${role === 'buyer' ? 'buyer' : 'seller'}`}>
                                {role}
                              </span>
                              <span style={{ fontWeight: 600, color: '#0F172A' }}>
                                {p.payerDetails?.name || p.userEmail || 'Anonymous'}
                              </span>
                            </div>
                            {p.payerDetails?.businessName && (
                              <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{p.payerDetails.businessName}</div>
                            )}
                            {p.userEmail && p.payerDetails?.name && (
                              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{p.userEmail}</div>
                            )}
                          </td>

                          {/* Channel / Item */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0F172A' }}>
                              <ItemIcon size={16} color={itemCfg.color} />
                              {itemCfg.label}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>ID: {p.itemId}</div>
                            {p.promoCode && (
                              <span className="badge-promo">
                                Promo: {p.promoCode}
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>
                              {formatInr(p.netAmount)}
                            </div>
                            {p.discountAmount > 0 && (
                              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>
                                Saved {formatInr(p.discountAmount)}
                              </div>
                            )}
                          </td>

                          {/* GST */}
                          <td>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                              {formatInr(p.tax?.totalTax)}
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>SAC: {p.tax?.sacCode || '998439'}</div>
                          </td>

                          {/* Status Badge */}
                          <td>
                            <span className={`badge-status ${statusCfg.statusClass}`}>
                              <statusCfg.icon size={13} />
                              {statusCfg.label}
                            </span>
                            {p.status === 'REFUND_PENDING' && (
                              <div style={{ fontSize: 10.5, color: '#D97706', marginTop: 3 }}>Will retry in 5m</div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                              <button
                                onClick={() => handleOpenDetails(p)}
                                className="payments-icon-btn"
                                title="Inspect Details"
                              >
                                <Eye size={16} />
                              </button>
                              {p.status !== 'PAID' && p.status !== 'REFUNDED' && (
                                <button
                                  onClick={() => handleSyncGateway(p)}
                                  disabled={syncingId === p._id}
                                  className="payments-icon-btn"
                                  title="Check / Sync Gateway Status"
                                  style={{ color: '#2563EB' }}
                                >
                                  <RefreshCw size={14} className={syncingId === p._id ? 'spin-icon' : ''} />
                                </button>
                              )}
                              {p.status === 'PAID' && (
                                <button
                                  onClick={() => {
                                    setRefundModalPayment(p);
                                    setRefundReason('Admin authorized refund');
                                    setRevokeBenefit(true);
                                  }}
                                  className="payments-icon-btn danger"
                                  title="Trigger Refund"
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Strip */}
            <div className="payments-pagination">
              <span>
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total transactions)
              </span>

              <div className="payments-pagination-btns">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="payments-page-btn"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="payments-page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: CREATE CUSTOM PAYMENT LINK / B2B QUOTE GENERATOR
      ───────────────────────────────────────────────────────────── */}
      {customLinkModalOpen && (
        <div className="payments-modal-overlay">
          <div className="payments-modal" style={{ maxWidth: 640 }}>
            <button
              onClick={() => setCustomLinkModalOpen(false)}
              className="payments-modal-close"
            >
              <X size={18} />
            </button>

            <h3 className="payments-modal-title">
              Create B2B Payment Link &amp; Proforma Invoice
            </h3>
            <p className="payments-modal-subtitle">
              Generate an official GST SAC 998439 payment link for any seller across Plans, Credits, Boosts, or Custom Spotlights.
            </p>

            {createdCustomLinkResult ? (
              /* Success Result Card */
              <div style={{ marginTop: 20 }}>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 style={{ fontSize: 17, fontWeight: 800, color: '#065F46', margin: '0 0 6px 0' }}>
                    Payment Link &amp; Proforma Invoice Generated!
                  </h4>
                  <p style={{ fontSize: 13, color: '#047857', margin: '0 0 16px 0' }}>
                    Reference: <strong>{createdCustomLinkResult.leadNumber}</strong> • Invoice: <strong>#{createdCustomLinkResult.invoiceNumber}</strong>
                  </p>

                  <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <input
                      readOnly
                      value={createdCustomLinkResult.paymentUrl}
                      style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12.5, fontFamily: 'monospace', color: '#0F172A', outline: 'none' }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdCustomLinkResult.paymentUrl);
                        showToast('Payment link copied to clipboard!');
                      }}
                      className="payments-btn payments-btn-primary"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      <Copy size={13} />
                      Copy Link
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <a
                      href={createdCustomLinkResult.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="payments-btn payments-btn-outline"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <ExternalLink size={14} />
                      Test Checkout Page
                    </a>
                    <button
                      onClick={() => {
                        setCustomLinkModalOpen(false);
                        setCreatedCustomLinkResult(null);
                      }}
                      className="payments-btn payments-btn-primary"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Modal Form */
              <div style={{ marginTop: 20 }}>
                {/* 1. Seller Lookup */}
                <div className="payments-modal-box">
                  <div className="payments-modal-box-title">1. Target Seller / Enterprise</div>

                  {selectedSeller ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedSeller.companyName || selectedSeller.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{selectedSeller.email} • {selectedSeller.phone || 'No phone'}</div>
                      </div>
                      <button
                        onClick={() => setSelectedSeller(null)}
                        style={{ border: 'none', background: '#F1F5F9', color: '#64748B', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                      >
                        Change Seller
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                          type="text"
                          placeholder="Search seller by Company Name, Name, Email, or Phone..."
                          value={sellerSearchInput}
                          onChange={(e) => handleSellerSearchChange(e.target.value)}
                          className="payments-search-input"
                          style={{ paddingLeft: 36, fontSize: 12.5 }}
                        />
                        {searchingSellers && (
                          <RefreshCw size={14} className="spin-icon" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        )}
                      </div>

                      {sellerSearchResults.length > 0 && (
                        <div className="seller-search-results">
                          {sellerSearchResults.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSeller(s)}
                              className="seller-search-item"
                            >
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                                {s.companyName || s.name}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                                {s.name} • {s.email} {s.phone ? `• ${s.phone}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pre-filled / editable customer inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        placeholder="Company Pvt Ltd"
                        className="payments-search-input"
                        style={{ padding: '7px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        GSTIN (for 18% ITC)
                      </label>
                      <input
                        type="text"
                        value={customGstin}
                        onChange={(e) => setCustomGstin(e.target.value.toUpperCase())}
                        placeholder="07AAAAA0000A1Z5"
                        className="payments-search-input"
                        style={{ padding: '7px 10px', textTransform: 'uppercase' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        Recipient Email *
                      </label>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="accounts@company.com"
                        className="payments-search-input"
                        style={{ padding: '7px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        Phone
                      </label>
                      <input
                        type="text"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="payments-search-input"
                        style={{ padding: '7px 10px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Package Category Selector */}
                <div className="payments-modal-box">
                  <div className="payments-modal-box-title">2. Select Service Category</div>

                  <div className="item-type-grid">
                    {[
                      { id: 'PLAN', label: 'Seller Plan', icon: CreditCard },
                      { id: 'CREDITS', label: 'SmartCredits', icon: Coins },
                      { id: 'BOOST', label: 'RFQ Lead Boost', icon: Zap },
                      { id: 'MISCELLANEOUS', label: 'Spotlight / Custom', icon: Sparkles },
                    ].map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setCustomItemType(t.id)}
                        className={`item-type-pill ${customItemType === t.id ? 'active' : ''}`}
                      >
                        <t.icon size={18} />
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Plan Options */}
                  {customItemType === 'PLAN' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Plan Tier
                        </label>
                        <select
                          value={customPlanKey}
                          onChange={(e) => setCustomPlanKey(e.target.value)}
                          className="payments-search-input"
                          style={{ padding: '7px 10px' }}
                        >
                          <option value="growth">Growth Plan (Standard B2B)</option>
                          <option value="pro">Pro Plan (High Volume)</option>
                          <option value="basic">Basic Plan (Entry Level)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Billing Cycle
                        </label>
                        <select
                          value={customBillingCycle}
                          onChange={(e) => setCustomBillingCycle(e.target.value)}
                          className="payments-search-input"
                          style={{ padding: '7px 10px' }}
                        >
                          <option value="yearly">Annual (1 Year)</option>
                          <option value="monthly">Monthly (30 Days)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Credits Options */}
                  {customItemType === 'CREDITS' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        Credits Package
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[50, 100, 250, 500].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setCustomCreditsCount(count)}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              border: customCreditsCount === count ? '1px solid #D97706' : '1px solid #CBD5E1',
                              background: customCreditsCount === count ? '#FEF3C7' : '#FFFFFF',
                              color: customCreditsCount === count ? '#92400E' : '#475569',
                            }}
                          >
                            {count} Credits
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boost Options */}
                  {customItemType === 'BOOST' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Boost Priority Tier
                        </label>
                        <select
                          value={customBoostTier}
                          onChange={(e) => setCustomBoostTier(e.target.value)}
                          className="payments-search-input"
                          style={{ padding: '7px 10px' }}
                        >
                          <option value="urgent">Urgent RFQ (Top Placement)</option>
                          <option value="high">High Priority</option>
                          <option value="standard">Standard Boost</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Target Requirement ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={customRequirementId}
                          onChange={(e) => setCustomRequirementId(e.target.value)}
                          placeholder="e.g. REQ-654321"
                          className="payments-search-input"
                          style={{ padding: '7px 10px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Spotlight / Custom Options */}
                  {customItemType === 'MISCELLANEOUS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Custom Package / Spotlight Title *
                        </label>
                        <input
                          type="text"
                          value={customItemTitle}
                          onChange={(e) => setCustomItemTitle(e.target.value)}
                          placeholder="e.g. Frontpage Spotlight Showcase (30 Days)"
                          className="payments-search-input"
                          style={{ padding: '7px 10px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          Package Scope &amp; Deliverables
                        </label>
                        <input
                          type="text"
                          value={customItemDescription}
                          onChange={(e) => setCustomItemDescription(e.target.value)}
                          placeholder="Banner placement, verified manufacturer badge & direct quote intake"
                          className="payments-search-input"
                          style={{ padding: '7px 10px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Valuation & GST Breakdown */}
                <div className="payments-modal-box">
                  <div className="payments-modal-box-title">3. Pricing &amp; GST SAC 998439 Breakdown</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        Base Commercial Amount (INR) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customBaseAmount}
                        onChange={(e) => setCustomBaseAmount(e.target.value)}
                        className="payments-search-input"
                        style={{ padding: '7px 10px', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                        Discount (INR, Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={customDiscount}
                        onChange={(e) => setCustomDiscount(e.target.value)}
                        className="payments-search-input"
                        style={{ padding: '7px 10px' }}
                      />
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                    <div className="payments-breakdown-row">
                      <span>Base Service Fee:</span>
                      <span>{formatInr(calcBase)}</span>
                    </div>
                    {calcDiscount > 0 && (
                      <div className="payments-breakdown-row" style={{ color: '#059669' }}>
                        <span>Discount Applied:</span>
                        <span>-{formatInr(calcDiscount)}</span>
                      </div>
                    )}
                    <div className="payments-breakdown-row" style={{ fontWeight: 600 }}>
                      <span>Net Taxable Value:</span>
                      <span>{formatInr(calcNet)}</span>
                    </div>
                    <div className="payments-breakdown-row" style={{ color: '#2563EB' }}>
                      <span>Statutory 18% GST (SAC 998439):</span>
                      <span>+{formatInr(calcGst)}</span>
                    </div>
                    <div className="payments-breakdown-row total">
                      <span>Final Total Payable:</span>
                      <span style={{ color: '#0F172A', fontSize: 16 }}>{formatInr(calcFinal)}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Dispatch Options */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="customDispatchEmail"
                      checked={customDispatchEmail}
                      onChange={(e) => setCustomDispatchEmail(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="customDispatchEmail" style={{ fontSize: 12, color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                      Dispatch payment link and Proforma Invoice directly to seller email
                    </label>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
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
                        Generate &amp; Dispatch Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: LEAD DETAILS DOSSIER
      ───────────────────────────────────────────────────────────── */}
      {leadDetailsModalOpen && selectedLead && (
        <div className="payments-modal-overlay">
          <div className="payments-modal">
            <button
              onClick={() => setLeadDetailsModalOpen(false)}
              className="payments-modal-close"
            >
              <X size={18} />
            </button>

            <h3 className="payments-modal-title">B2B Proforma Quote Dossier</h3>
            <p className="payments-modal-subtitle">
              Reference: <strong style={{ color: '#0F172A' }}>{selectedLead.leadNumber}</strong>
            </p>

            <div style={{ marginTop: 20 }}>
              {/* Customer Box */}
              <div className="payments-modal-box">
                <div className="payments-modal-box-title">Enterprise Identification</div>
                <div className="payments-detail-grid">
                  <div><span style={{ color: '#94A3B8' }}>Company:</span> <strong>{selectedLead.companyName || '—'}</strong></div>
                  <div><span style={{ color: '#94A3B8' }}>Representative:</span> <strong>{selectedLead.contactPerson || '—'}</strong></div>
                  <div><span style={{ color: '#94A3B8' }}>Email:</span> <strong>{selectedLead.email}</strong></div>
                  <div><span style={{ color: '#94A3B8' }}>Phone:</span> <strong>{selectedLead.phone || '—'}</strong></div>
                  <div><span style={{ color: '#94A3B8' }}>GSTIN:</span> <strong>{selectedLead.gstin || 'Unregistered'}</strong></div>
                  <div><span style={{ color: '#94A3B8' }}>Source:</span> <strong>{selectedLead.source}</strong></div>
                </div>
              </div>

              {/* Scope Box */}
              <div className="payments-modal-box">
                <div className="payments-modal-box-title">Commercial Package Scope</div>
                <div className="payments-detail-grid">
                  <div><span style={{ color: '#94A3B8' }}>Item Type:</span> <strong>{selectedLead.itemType}</strong></div>
                  {selectedLead.itemDetails?.planKey && (
                    <div><span style={{ color: '#94A3B8' }}>Plan Key:</span> <strong style={{ textTransform: 'uppercase' }}>{selectedLead.itemDetails.planKey} ({selectedLead.itemDetails.billingCycle})</strong></div>
                  )}
                  {selectedLead.itemDetails?.creditsCount && (
                    <div><span style={{ color: '#94A3B8' }}>Credits:</span> <strong>{selectedLead.itemDetails.creditsCount}</strong></div>
                  )}
                  {selectedLead.itemDetails?.customTitle && (
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#94A3B8' }}>Package Title:</span> <strong>{selectedLead.itemDetails.customTitle}</strong></div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="payments-modal-box">
                <div className="payments-modal-box-title">Valuation &amp; Tax (SAC 998439)</div>
                <div className="payments-breakdown-row">
                  <span>Base Amount:</span>
                  <span>{formatInr(selectedLead.baseAmount)}</span>
                </div>
                {selectedLead.discountAmount > 0 && (
                  <div className="payments-breakdown-row" style={{ color: '#059669' }}>
                    <span>Discount:</span>
                    <span>-{formatInr(selectedLead.discountAmount)}</span>
                  </div>
                )}
                <div className="payments-breakdown-row total">
                  <span>Net Taxable Value:</span>
                  <span>{formatInr(selectedLead.netAmount)}</span>
                </div>
                <div className="payments-breakdown-row" style={{ color: '#2563EB' }}>
                  <span>Total GST (18%):</span>
                  <span>{formatInr(selectedLead.tax?.totalTax)}</span>
                </div>
                <div className="payments-breakdown-row total">
                  <span>Final Invoice Total:</span>
                  <span style={{ color: '#0F172A', fontSize: 16 }}>{formatInr(selectedLead.finalAmount)}</span>
                </div>
              </div>

              {/* Payment Link Info if Dispatched */}
              {selectedLead.paymentLinkUrl && (
                <div className="payments-modal-box" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                  <div className="payments-modal-box-title" style={{ color: '#1D4ED8' }}>Live Checkout Link</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <input
                      readOnly
                      value={selectedLead.paymentLinkUrl}
                      style={{ flex: 1, border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 10px', fontSize: 12, background: '#FFF' }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLead.paymentLinkUrl);
                        showToast('Copied link!');
                      }}
                      className="payments-btn payments-btn-primary"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      <Copy size={13} />
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                {selectedLead.status === 'PENDING' && (
                  <button
                    disabled={dispatchingLeadId === selectedLead._id}
                    onClick={() => handleDispatchLead(selectedLead)}
                    className="payments-btn payments-btn-primary"
                  >
                    <Send size={14} />
                    Dispatch Proforma Invoice Link
                  </button>
                )}
                <button
                  onClick={() => setLeadDetailsModalOpen(false)}
                  className="payments-btn payments-btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: PAYMENT LEDGER DETAILS / AUDIT DOSSIER
      ───────────────────────────────────────────────────────────── */}
      {detailsModalOpen && selectedPayment && (
        <div className="payments-modal-overlay">
          <div className="payments-modal">
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="payments-modal-close"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
              <div>
                <h3 className="payments-modal-title">
                  Tax Invoice &amp; Audit Dossier
                </h3>
                <p className="payments-modal-subtitle">
                  {selectedPayment.payment?.invoiceNumber ? (
                    <span style={{ fontWeight: 700, color: '#1D4ED8' }}>Invoice: {selectedPayment.payment.invoiceNumber}</span>
                  ) : (
                    <span>Order: {selectedPayment.payment?.orderId}</span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedPayment.payment?.status !== 'PAID' && selectedPayment.payment?.status !== 'REFUNDED' && (
                  <button
                    onClick={() => handleSyncGateway(selectedPayment.payment)}
                    disabled={syncingId === selectedPayment.payment?._id}
                    className="payments-btn payments-btn-outline"
                    style={{ padding: '6px 12px', fontSize: 12, color: '#2563EB', borderColor: '#BFDBFE' }}
                  >
                    <RefreshCw size={14} className={syncingId === selectedPayment.payment?._id ? 'spin-icon' : ''} />
                    Sync Gateway
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="payments-btn payments-btn-outline"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  <Printer size={14} />
                  Print Invoice
                </button>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              {/* Customer Info */}
              <div className="payments-modal-box">
                <div className="payments-modal-box-title">Customer &amp; Tax Identity</div>
                <div className="payments-detail-grid">
                  <div>
                    <span style={{ color: '#94A3B8' }}>Name:</span>{' '}
                    <strong>{selectedPayment.payment?.payerDetails?.name || selectedPayment.payment?.userId?.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Business:</span>{' '}
                    <strong>{selectedPayment.payment?.payerDetails?.businessName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Email:</span>{' '}
                    {selectedPayment.payment?.userEmail || 'N/A'}
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Phone:</span>{' '}
                    {selectedPayment.payment?.userPhone || 'N/A'}
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>GSTIN:</span>{' '}
                    <strong>{selectedPayment.payment?.payerDetails?.gstin || 'Unregistered / Consumer'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Role:</span>{' '}
                    <span className={`badge-role ${selectedPayment.payment?.payerRole || 'buyer'}`}>
                      {selectedPayment.payment?.payerRole || selectedPayment.payment?.userId?.role || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchased Service & Line Item */}
              <div className="payments-modal-box" style={{ background: '#F8FAFC', borderLeft: '4px solid #E8581C' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div className="payments-modal-box-title" style={{ margin: 0, color: '#0F172A' }}>
                    Purchased Service &amp; Line Item
                  </div>
                  <span className={`badge-role ${selectedPayment.payment?.itemType === 'LEAD_BOOST' ? 'buyer' : 'seller'}`} style={{ textTransform: 'uppercase', fontSize: 11 }}>
                    {selectedPayment.payment?.itemType === 'SELLER_SUBSCRIPTION' ? 'Seller Plan' :
                     selectedPayment.payment?.itemType === 'LEAD_BOOST' ? 'RFQ Lead Boost' :
                     selectedPayment.payment?.itemType === 'CREDIT_BUNDLE' ? 'SmartCredits' : selectedPayment.payment?.itemType}
                  </span>
                </div>

                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                  {selectedPayment.payment?.metadata?.itemTitle ||
                   selectedPayment.payment?.fulfillment?.meta?.itemTitle ||
                   (selectedPayment.payment?.itemType === 'SELLER_SUBSCRIPTION' ? `${selectedPayment.payment?.itemId} Membership` :
                    selectedPayment.payment?.itemType === 'LEAD_BOOST' ? `Priority RFQ Lead Boost (${selectedPayment.payment?.itemId})` :
                    `${selectedPayment.payment?.itemId} Credit Package`)}
                </div>

                <div className="payments-detail-grid">
                  <div>
                    <span style={{ color: '#94A3B8' }}>Item Key:</span>{' '}
                    <strong style={{ fontFamily: 'monospace' }}>{selectedPayment.payment?.itemId || '—'}</strong>
                  </div>

                  {selectedPayment.payment?.metadata?.billingCycle && (
                    <div>
                      <span style={{ color: '#94A3B8' }}>Billing Cycle:</span>{' '}
                      <strong style={{ textTransform: 'capitalize' }}>{selectedPayment.payment?.metadata?.billingCycle}</strong>
                    </div>
                  )}

                  {selectedPayment.payment?.fulfillmentDetails?.creditsGranted > 0 && (
                    <div>
                      <span style={{ color: '#94A3B8' }}>Credits Added:</span>{' '}
                      <strong style={{ color: '#D97706' }}>+{selectedPayment.payment?.fulfillmentDetails?.creditsGranted} SmartCredits</strong>
                    </div>
                  )}

                  {(selectedPayment.payment?.fulfillmentDetails?.planExpiresAt || selectedPayment.payment?.fulfillmentDetails?.boostExpiresAt) && (
                    <div>
                      <span style={{ color: '#94A3B8' }}>Service Valid Until:</span>{' '}
                      <strong>{formatDate(selectedPayment.payment?.fulfillmentDetails?.planExpiresAt || selectedPayment.payment?.fulfillmentDetails?.boostExpiresAt)}</strong>
                    </div>
                  )}

                  {(selectedPayment.payment?.fulfillment?.meta?.requirementId || selectedPayment.payment?.metadata?.requirementId) && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#94A3B8' }}>Boosted Requirement ID:</span>{' '}
                      <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#EFF6FF', padding: '2px 6px', borderRadius: 4, color: '#1D4ED8' }}>
                        {selectedPayment.payment?.fulfillment?.meta?.requirementId || selectedPayment.payment?.metadata?.requirementId}
                      </span>
                    </div>
                  )}

                  {selectedPayment.payment?.promoCode && (
                    <div>
                      <span style={{ color: '#94A3B8' }}>Promo Code:</span>{' '}
                      <span className="badge-promo">{selectedPayment.payment?.promoCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & GST Breakdown */}
              <div className="payments-modal-box" style={{ background: '#FFFFFF' }}>
                <div className="payments-modal-box-title">Financial Breakdown (SAC 998439)</div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ padding: '6px 0 10px 0', borderBottom: '1px solid #E2E8F0', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      1x {selectedPayment.payment?.metadata?.itemTitle ||
                          (selectedPayment.payment?.itemType === 'SELLER_SUBSCRIPTION' ? `Seller Membership (${selectedPayment.payment?.itemId})` :
                           selectedPayment.payment?.itemType === 'LEAD_BOOST' ? `Lead Boost (${selectedPayment.payment?.itemId})` :
                           `Credits Package (${selectedPayment.payment?.itemId})`)}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      SAC Code: {selectedPayment.payment?.tax?.sacCode || selectedPayment.payment?.sacCode || '998439'} (B2B Online Commercial Marketplace Services)
                    </div>
                  </div>
                  <div className="payments-breakdown-row">
                    <span>Base Amount:</span>
                    <span>{formatInr(selectedPayment.payment?.baseAmount)}</span>
                  </div>
                  <div className="payments-breakdown-row" style={{ color: '#059669' }}>
                    <span>Discount Applied:</span>
                    <span>-{formatInr(selectedPayment.payment?.discountAmount)}</span>
                  </div>
                  <div className="payments-breakdown-row total">
                    <span>Net Paid Amount:</span>
                    <span>{formatInr(selectedPayment.payment?.netAmount)}</span>
                  </div>
                  <div className="payments-breakdown-row" style={{ fontSize: 12, color: '#64748B' }}>
                    <span>CGST (9%):</span>
                    <span>{formatInr(selectedPayment.payment?.tax?.cgst)}</span>
                  </div>
                  <div className="payments-breakdown-row" style={{ fontSize: 12, color: '#64748B' }}>
                    <span>SGST (9%):</span>
                    <span>{formatInr(selectedPayment.payment?.tax?.sgst)}</span>
                  </div>
                  <div className="payments-breakdown-row" style={{ fontSize: 12, color: '#64748B' }}>
                    <span>IGST (18%):</span>
                    <span>{formatInr(selectedPayment.payment?.tax?.igst)}</span>
                  </div>
                  <div className="payments-breakdown-row" style={{ borderTop: '1px solid #E2E8F0', paddingTop: 6, fontWeight: 700 }}>
                    <span>Total GST Included:</span>
                    <span>{formatInr(selectedPayment.payment?.tax?.totalTax)}</span>
                  </div>
                </div>
              </div>

              {/* Fulfillment Verification */}
              <div className="payments-modal-box">
                <div className="payments-modal-box-title">Fulfillment Verification</div>
                <div className="payments-detail-grid">
                  <div>
                    <span style={{ color: '#94A3B8' }}>Fulfilled:</span>{' '}
                    <strong style={{ color: selectedPayment.payment?.fulfillment?.fulfilled ? '#059669' : '#D97706' }}>
                      {selectedPayment.payment?.fulfillment?.fulfilled ? 'YES (Locked)' : 'NO'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Method:</span>{' '}
                    {selectedPayment.payment?.fulfillment?.fulfillmentMethod || '—'}
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Fulfilled At:</span>{' '}
                    {formatDate(selectedPayment.payment?.fulfillment?.fulfilledAt)}
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Gateway PayID:</span>{' '}
                    <span style={{ fontFamily: 'monospace' }}>{selectedPayment.payment?.paymentId || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Refund Info if any */}
              {selectedPayment.payment?.refundDetails?.amount > 0 && (
                <div className="payments-modal-box" style={{ background: '#F0F9FF', borderColor: '#BAE6FD' }}>
                  <div className="payments-modal-box-title" style={{ color: '#0369A1' }}>Refund Summary</div>
                  <div style={{ fontSize: 12.5, color: '#0C4A6E', lineHeight: 1.6 }}>
                    <div>Refund ID: <strong>{selectedPayment.payment?.refundDetails?.refundId}</strong></div>
                    <div>Amount: <strong>{formatInr(selectedPayment.payment?.refundDetails?.amount)}</strong> (100% Full)</div>
                    <div>ARN: {selectedPayment.payment?.refundDetails?.arn || 'Processing'}</div>
                    <div>Processed: {formatDate(selectedPayment.payment?.refundDetails?.processedAt)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: MANUAL REFUND CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {refundModalPayment && (
        <div className="payments-modal-overlay">
          <div className="payments-modal" style={{ maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 10, borderRadius: '50%' }}>
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="payments-modal-title" style={{ fontSize: 16 }}>Issue 100% Full Refund</h3>
                <p className="payments-modal-subtitle">Order: {refundModalPayment.orderId}</p>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                  <span>Customer Refund Amount:</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>{formatInr(refundModalPayment.netAmount)}</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                  Platform absorbs the 2% Razorpay gateway fee. Customer receives 100% of their money back via optimum IMPS/UPI.
                </p>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Refund Reason (Audit Log)
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="payments-search-input"
                  style={{ padding: '8px 12px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <input
                  type="checkbox"
                  id="revokeBenefit"
                  checked={revokeBenefit}
                  onChange={(e) => setRevokeBenefit(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="revokeBenefit" style={{ fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                  Revoke delivered benefits (deduct credits, cancel plan tier, or disable boost)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                disabled={refunding}
                onClick={() => setRefundModalPayment(null)}
                className="payments-btn payments-btn-outline"
              >
                Cancel
              </button>
              <button
                disabled={refunding}
                onClick={handleExecuteRefund}
                className="payments-btn payments-btn-danger"
              >
                {refunding ? <RefreshCw size={14} className="spin-icon" /> : <RotateCcw size={14} />}
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
