'use strict';
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowUpDown,
  Coins,
  CreditCard,
  Zap,
  X,
  FileSpreadsheet,
  Copy,
  Printer,
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

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
  PAID: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800', icon: CheckCircle2 },
  CREATED: { label: 'Created', color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800', icon: Clock },
  FAILED: { label: 'Failed', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800', icon: XCircle },
  REFUND_PENDING: { label: 'Refund Pending', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800', icon: AlertTriangle },
  REFUNDED: { label: 'Refunded', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800', icon: RotateCcw },
  DISPUTED: { label: 'Disputed', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800', icon: ShieldAlert },
};

const ITEM_TYPE_LABELS = {
  CREDIT_BUNDLE: { label: 'SmartCredits', icon: Coins, color: 'text-amber-500' },
  SELLER_SUBSCRIPTION: { label: 'Seller Plan', icon: CreditCard, color: 'text-blue-500' },
  LEAD_BOOST: { label: 'RFQ Lead Boost', icon: Zap, color: 'text-orange-500' },
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

  if (loaded && !canManagePayments) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          You do not have administrative permissions to inspect payments or financial ledgers. Contact your Super Admin for access.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-xl border px-4 py-3 shadow-lg transition-all ${
            toastMessage.type === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
          }`}
        >
          {toastMessage.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            <Receipt className="h-7 w-7 text-orange-600" />
            Payments & Financial Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Multi-channel revenue ledger, GST SAC 998439 compliance, and automated full-refund guarantees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayments}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gross Revenue</span>
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-950/60">
              <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatInr(metrics.totalGrossRevenue)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span>Seller: <strong className="text-slate-700 dark:text-slate-300">{formatInr(metrics.sellerRevenue || 0)}</strong></span>
            <span>•</span>
            <span>Buyer: <strong className="text-slate-700 dark:text-slate-300">{formatInr(metrics.buyerRevenue || 0)}</strong></span>
          </div>
        </div>

        {/* Total GST Collected */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total GST (18%)</span>
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950/60">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatInr(metrics.totalGstCollected)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            SAC: 998439 (CGST: {formatInr(metrics.cgstTotal)}, SGST: {formatInr(metrics.sgstTotal)})
          </div>
        </div>

        {/* Total Refunded */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Refunds Given</span>
            <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-950/60">
              <RotateCcw className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatInr(metrics.totalRefundedAmount)}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            100% full return guarantee (0% deduction)
          </div>
        </div>

        {/* Issues & Pending */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Actions</span>
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-950/60">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {metrics.pendingRefundsCount || 0}
            </span>
            <span className="text-xs text-amber-600">Pending Refunds</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Disputed chargebacks: <span className="font-semibold text-rose-600">{metrics.disputedCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Segregated Tab Switcher (Section 6.2) */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800">
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
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order ID, Payment ID, Email, Phone, Promo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Invoice / Order ID</th>
                <th className="px-5 py-3.5">Customer & Role</th>
                <th className="px-5 py-3.5">Channel / Item</th>
                <th className="px-5 py-3.5">Amount (INR)</th>
                <th className="px-5 py-3.5">GST (18%)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-orange-500" />
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No payment records match your filters.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.CREATED;
                  const itemCfg = ITEM_TYPE_LABELS[p.itemType] || { label: p.itemType, icon: Receipt, color: 'text-slate-500' };
                  const ItemIcon = itemCfg.icon;

                  return (
                    <tr key={p._id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      {/* Invoice & Order ID */}
                      <td className="px-5 py-4">
                        {p.invoiceNumber ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                              {p.invoiceNumber}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(p.invoiceNumber);
                                showToast(`Copied ${p.invoiceNumber}`);
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Copy Invoice #"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {p.orderId}
                          </div>
                        )}
                        <div className="mt-0.5 text-xs text-slate-400">{formatDate(p.createdAt)}</div>
                        {p.paymentId && (
                          <div className="font-mono text-[11px] text-slate-400">PayID: {p.paymentId}</div>
                        )}
                      </td>

                      {/* Customer & Role */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              p.payerRole === 'buyer'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {p.payerRole || (p.itemType === 'LEAD_BOOST' ? 'buyer' : 'seller')}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {p.payerDetails?.name || p.userEmail || 'Anonymous'}
                          </span>
                        </div>
                        {p.payerDetails?.businessName && (
                          <div className="text-xs text-slate-500">{p.payerDetails.businessName}</div>
                        )}
                        {p.userEmail && p.payerDetails?.name && (
                          <div className="text-[11px] text-slate-400">{p.userEmail}</div>
                        )}
                      </td>

                      {/* Channel / Item */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <ItemIcon className={`h-4 w-4 ${itemCfg.color}`} />
                          {itemCfg.label}
                        </div>
                        <div className="text-xs text-slate-400">ID: {p.itemId}</div>
                        {p.promoCode && (
                          <span className="mt-1 inline-block rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                            Promo: {p.promoCode}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatInr(p.netAmount)}
                        </div>
                        {p.discountAmount > 0 && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">
                            Saved {formatInr(p.discountAmount)}
                          </div>
                        )}
                      </td>

                      {/* GST */}
                      <td className="px-5 py-4">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {formatInr(p.tax?.totalTax)}
                        </div>
                        <div className="text-[11px] text-slate-400">SAC: {p.tax?.sacCode || '998439'}</div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusCfg.color}`}
                        >
                          <statusCfg.icon className="h-3.5 w-3.5" />
                          {statusCfg.label}
                        </span>
                        {p.status === 'REFUND_PENDING' && (
                          <div className="mt-1 text-[10px] text-amber-600">Will retry in 5m</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetails(p)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            title="Inspect Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {p.status === 'PAID' && (
                            <button
                              onClick={() => {
                                setRefundModalPayment(p);
                                setRefundReason('Admin authorized refund');
                                setRevokeBenefit(true);
                              }}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                              title="Trigger Refund"
                            >
                              <RotateCcw className="h-4 w-4" />
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
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total transactions)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Drawer / Modal */}
      {detailsModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Tax Invoice & Audit Dossier
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPayment.payment?.invoiceNumber ? (
                    <span className="font-semibold text-blue-600">Invoice: {selectedPayment.payment.invoiceNumber}</span>
                  ) : (
                    <span>Order: {selectedPayment.payment?.orderId}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Invoice
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              {/* Customer Info */}
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <span className="text-xs font-semibold uppercase text-slate-400">Customer & Tax Identity</span>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Name:</span> {selectedPayment.payment?.payerDetails?.name || selectedPayment.payment?.userId?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-400">Business:</span> {selectedPayment.payment?.payerDetails?.businessName || 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span> {selectedPayment.payment?.userEmail || 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-400">Phone:</span> {selectedPayment.payment?.userPhone || 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-400">GSTIN:</span> {selectedPayment.payment?.payerDetails?.gstin || 'Unregistered / Consumer'}
                  </div>
                  <div>
                    <span className="text-slate-400">Role:</span> {selectedPayment.payment?.payerRole || selectedPayment.payment?.userId?.role || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Pricing & GST Breakdown */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <span className="text-xs font-semibold uppercase text-slate-400">Financial Breakdown (SAC 998439)</span>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Amount:</span>
                    <span className="font-medium">{formatInr(selectedPayment.payment?.baseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied:</span>
                    <span>-{formatInr(selectedPayment.payment?.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-900 dark:border-slate-800 dark:text-white">
                    <span>Net Paid Amount:</span>
                    <span>{formatInr(selectedPayment.payment?.netAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>CGST (9%):</span>
                    <span>{formatInr(selectedPayment.payment?.tax?.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SGST (9%):</span>
                    <span>{formatInr(selectedPayment.payment?.tax?.sgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>IGST (18%):</span>
                    <span>{formatInr(selectedPayment.payment?.tax?.igst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    <span>Total GST Included:</span>
                    <span>{formatInr(selectedPayment.payment?.tax?.totalTax)}</span>
                  </div>
                </div>
              </div>

              {/* Fulfillment & Mutex Info */}
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <span className="text-xs font-semibold uppercase text-slate-400">Fulfillment Verification</span>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Fulfilled:</span>{' '}
                    <span className="font-semibold text-emerald-600">
                      {selectedPayment.payment?.fulfillment?.fulfilled ? 'YES (Locked)' : 'NO'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Method:</span>{' '}
                    {selectedPayment.payment?.fulfillment?.fulfillmentMethod || '—'}
                  </div>
                  <div>
                    <span className="text-slate-400">Fulfilled At:</span>{' '}
                    {formatDate(selectedPayment.payment?.fulfillment?.fulfilledAt)}
                  </div>
                  <div>
                    <span className="text-slate-400">Gateway PayID:</span>{' '}
                    {selectedPayment.payment?.paymentId || '—'}
                  </div>
                </div>
              </div>

              {/* Refund Info if any */}
              {selectedPayment.payment?.refundDetails?.amount > 0 && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/40">
                  <span className="text-xs font-semibold uppercase text-sky-800 dark:text-sky-300">Refund Summary</span>
                  <div className="mt-2 space-y-1 text-xs text-sky-900 dark:text-sky-200">
                    <div>Refund ID: {selectedPayment.payment?.refundDetails?.refundId}</div>
                    <div>Amount: {formatInr(selectedPayment.payment?.refundDetails?.amount)} (100% Full)</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-100 p-2.5 dark:bg-rose-950/60">
                <RotateCcw className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Issue 100% Full Refund</h3>
                <p className="text-xs text-slate-500">Order: {refundModalPayment.orderId}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800">
                <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-100">
                  <span>Customer Refund Amount:</span>
                  <span className="text-emerald-600">{formatInr(refundModalPayment.netAmount)}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Platform absorbs the 2% Razorpay gateway fee. Customer receives 100% of their money back via optimum IMPS/UPI.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Refund Reason (Audit Log)
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="revokeBenefit"
                  checked={revokeBenefit}
                  onChange={(e) => setRevokeBenefit(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="revokeBenefit" className="text-xs text-slate-600 dark:text-slate-300">
                  Revoke delivered benefits (deduct credits, cancel plan tier, or disable boost)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={refunding}
                onClick={() => setRefundModalPayment(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={refunding}
                onClick={handleExecuteRefund}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {refunding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
