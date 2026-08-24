'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Badge from '@/components/admin/Badge';
import Toggle from '@/components/admin/Toggle';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function AdminProductsPage() {
  const { hasPermission } = useAdminPermissions();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceMin: '',
    priceMax: '',
    dateFrom: '',
    dateTo: '',
    isActive: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.search)   params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.priceMin) params.set('priceMin', filters.priceMin);
    if (filters.priceMax) params.set('priceMax', filters.priceMax);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)   params.set('dateTo', filters.dateTo);
    if (filters.isActive) params.set('isActive', filters.isActive);

    const res = await fetch(`/api/admin/products?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ search: '', category: '', priceMin: '', priceMax: '', dateFrom: '', dateTo: '', isActive: '' });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleToggleVisibility = async (product) => {
    if (!hasPermission('products.moderate') || !product.manufacturerId) return;
    const res = await fetch(`/api/admin/manufacturers/${product.manufacturerId}/products/${product._id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    const data = await res.json();
    if (data.success) load();
    else alert(data.message || 'Failed to toggle visibility');
  };

  const formatINR = (price) => {
    if (price === null || price === undefined || price === '') return '-';
    if (typeof price === 'string') {
      const trimmed = price.trim();
      if (trimmed.includes('₹') || trimmed.includes('-')) return trimmed.startsWith('₹') ? trimmed : `₹${trimmed}`;
      const num = Number(trimmed.replace(/,/g, ''));
      if (!isNaN(num)) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
      }
      return trimmed.startsWith('₹') ? trimmed : `₹${trimmed}`;
    }
    const num = Number(price);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Products ({total})</h1>
        {activeFilterCount > 0 && (
          <button className="admin-btn admin-btn-secondary" onClick={clearFilters} style={{ fontSize: 13 }}>
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          className="admin-input"
          style={{ flex: '1 1 200px' }}
          placeholder="Search products by name..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <input
          className="admin-input"
          style={{ flex: '0 1 160px' }}
          placeholder="Category..."
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        />
        <select
          className="admin-select"
          value={filters.isActive}
          onChange={(e) => setFilter('isActive', e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Hidden</option>
        </select>
        <button
          className={`admin-btn ${filtersExpanded ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setFiltersExpanded((v) => !v)}
          style={{ fontSize: 13 }}
        >
          {filtersExpanded ? 'Hide' : 'More'} Filters
        </button>
      </div>

      {filtersExpanded && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Price Min (INR)</label>
            <input
              type="number"
              className="admin-input"
              style={{ width: '100%' }}
              placeholder="0"
              value={filters.priceMin}
              onChange={(e) => setFilter('priceMin', e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Price Max (INR)</label>
            <input
              type="number"
              className="admin-input"
              style={{ width: '100%' }}
              placeholder="No limit"
              value={filters.priceMax}
              onChange={(e) => setFilter('priceMax', e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Created From</label>
            <input
              type="date"
              className="admin-input"
              style={{ width: '100%' }}
              value={filters.dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Created To</label>
            <input
              type="date"
              className="admin-input"
              style={{ width: '100%' }}
              value={filters.dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', color: '#64748B', padding: 32 }}>
          No products found matching your filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Seller</th>
                <th>Created</th>
                <th>Status</th>
                <th>Visible</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 11, flexShrink: 0 }}>
                          N/A
                        </div>
                      )}
                      <strong style={{ fontSize: 14 }}>{p.name}</strong>
                    </div>
                  </td>
                  <td>{p.category || '-'}</td>
                  <td>{formatINR(p.price)}{p.unit ? ` / ${p.unit}` : ''}</td>
                  <td>
                    {p.manufacturer ? (
                      <Link href={`/admin/manufacturers/${p.manufacturer._id}`} style={{ fontSize: 13, color: '#E8581C' }}>
                        {p.manufacturer.name}
                      </Link>
                    ) : (
                      <span style={{ fontSize: 13, color: '#94A3B8' }}>{p.sellerName || '-'}</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: '#64748B' }}>
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <Badge label={p.isActive ? 'Active' : 'Hidden'} variant={p.isActive ? 'active' : 'expired'} />
                  </td>
                  <td>
                    {hasPermission('products.moderate') ? (
                      <Toggle checked={p.isActive} onChange={() => handleToggleVisibility(p)} />
                    ) : (
                      <span style={{ fontSize: 12, color: p.isActive ? '#15803D' : '#94A3B8', fontWeight: 600 }}>
                        {p.isActive ? 'Visible' : 'Hidden'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-pagination">
        <button className="admin-btn admin-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button className="admin-btn admin-btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
