'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data);
          setOpen(true);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px' }}>
        <Search size={16} color="rgba(255,255,255,0.6)" style={{ marginRight: 6 }} />
        <input
          type="text"
          placeholder="Global search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: 13,
            width: '100%',
          }}
        />
      </div>

      {open && results && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            color: '#0F172A',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            marginTop: 4,
            maxHeight: 300,
            overflowY: 'auto',
            zIndex: 999,
            padding: 8,
          }}
        >
          {loading && <div style={{ fontSize: 12, padding: 8, color: '#64748B' }}>Searching...</div>}
          
          {results.manufacturers && results.manufacturers.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', padding: '4px 8px' }}>
                Manufacturers
              </div>
              {results.manufacturers.map((m) => (
                <div
                  key={m._id}
                  onClick={() => {
                    setOpen(false);
                    setQuery('');
                    router.push(`/admin/manufacturers/${m._id}`);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {m.name}
                </div>
              ))}
            </div>
          )}

          {results.buyers && results.buyers.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', padding: '4px 8px' }}>
                Buyers
              </div>
              {results.buyers.map((b) => (
                <div
                  key={b._id}
                  onClick={() => {
                    setOpen(false);
                    setQuery('');
                    router.push(`/admin/buyers/${b._id}`);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {b.firstName} {b.lastName} ({b.email})
                </div>
              ))}
            </div>
          )}

          {(!results.manufacturers || results.manufacturers.length === 0) &&
            (!results.buyers || results.buyers.length === 0) &&
            !loading && (
              <div style={{ fontSize: 12, padding: 8, color: '#64748B' }}>No results found</div>
            )}
        </div>
      )}
    </div>
  );
}
