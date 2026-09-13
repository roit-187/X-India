'use strict';
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
};

const ITEM_TYPE_LABELS = {
  CREDIT_BUNDLE: { label: 'SmartCredits', icon: Coins, color: '#D97706' },
  SELLER_SUBSCRIPTION: { label: 'Seller Plan', icon: CreditCard, color: '#2563EB' },
  LEAD_BOOST: { label: 'RFQ Lead Boost', icon: Zap, color: '#EA580C' },
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

  // Filter States
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [itemType, setItemType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
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

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', pagination.page);
      params.set('limit', pagination.limit);
      if (activeTab !== 'all') params.set('tab', activeTab);
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

  useEffect(() => {
    if (loaded && canManagePayments) {
      fetchPayments();
    }
  }, [loaded, canManagePayments, fetchPayments]);

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
          <button onClick={fetchPayments} className="payments-btn payments-btn-outline">
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            Refresh
          </button>
          <button onClick={handleExportCsv} className="payments-btn payments-btn-primary">
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
              setPagination((prev) => ({ ...prev, page: 1 }));
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

      {/* Filter & Search Bar */}
      <div className="payments-filter-bar">
        <div className="payments-search-wrap">
          <Search size={16} className="payments-search-icon" />
          <input
            type="text"
            placeholder="Search Order ID, Payment ID, Email, Phone, Promo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
            className="payments-search-input"
          />
        </div>

        <div className="payments-filter-group">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="payments-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="CREATED">Created (In-Flight)</option>
            <option value="FAILED">Failed</option>
            <option value="REFUND_PENDING">Refund Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="DISPUTED">Disputed</option>
          </select>

          {/* Item Type Filter */}
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="payments-select"
          >
            <option value="ALL">All Channels</option>
            <option value="CREDIT_BUNDLE">SmartCredits</option>
            <option value="SELLER_SUBSCRIPTION">Seller Plans</option>
            <option value="LEAD_BOOST">RFQ Lead Boost</option>
          </select>

          {/* Date Range Inputs */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="payments-date-input"
          />
          <span style={{ fontSize: 12, color: '#94A3B8' }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="payments-date-input"
          />

          {(search || status !== 'ALL' || itemType !== 'ALL' || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch('');
                setStatus('ALL');
                setItemType('ALL');
                setDateFrom('');
                setDateTo('');
              }}
              className="payments-reset-btn"
            >
              Reset
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

      {/* Details Drawer / Modal */}
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

      {/* Manual Refund Confirmation Modal */}
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
