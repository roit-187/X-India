import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeller, getSellerProducts } from '@/lib/api';
import { Package, Zap, Tag, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

export const metadata = { title: 'Products Catalog — XINDIA' };

export default async function ProductsPage({ params, searchParams }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const page = Math.max(parseInt(searchParams?.page) || 1, 1);
  const category = searchParams?.category;
  const { products, totalPages, totalProducts } = await getSellerProducts(params.slug, { page, category });

  return (
    <div className="portfolio-container">
      <div className="portfolio-section-header">
        <div>
          <h2 className="portfolio-section-title">Products Catalog</h2>
          <p className="portfolio-section-desc">
            Direct factory-priced products available for OEM manufacturing and bulk dispatch.
          </p>
        </div>
      </div>

      {(!products || products.length === 0) ? (
        <div className="portfolio-empty-state">
          <Package size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
          <div>No products listed in this catalog yet.</div>
        </div>
      ) : (
        <>
          <div className="portfolio-product-grid">
            {products.map((p) => {
              const custOpts = p.customizationOptions || {};
              const hasLogo = custOpts.logoCustomization || custOpts.customLogo;
              const hasPkg = custOpts.packagingCustomization || custOpts.customPackaging;

              return (
                <div key={p._id} className="portfolio-product-card">
                  <div className="portfolio-product-image-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400&auto=format&fit=crop'}
                      alt={p.name}
                      className="portfolio-product-image"
                    />
                    {p.deliveryTime && (
                      <div className="portfolio-product-dispatch-pill">
                        <Zap size={11} />
                        <span>{p.deliveryTime}</span>
                      </div>
                    )}
                  </div>
                  <div className="portfolio-product-body">
                    <h3 className="portfolio-product-name">{p.name}</h3>
                    <div className="portfolio-product-price-row">
                      <div className="portfolio-product-price">
                        {p.price} {p.unit ? <span style={{ fontSize: 13, color: 'var(--p-text-muted)', fontWeight: 500 }}>/ {p.unit}</span> : ''}
                      </div>
                      <span className="portfolio-product-moq">MOQ: {p.moq}</span>
                    </div>

                    {(hasLogo || hasPkg) && (
                      <div className="portfolio-product-custom-tags">
                        {hasLogo && <span className="portfolio-custom-tag"><Tag size={11} /> Custom Logo</span>}
                        {hasPkg && <span className="portfolio-custom-tag"><Package size={11} /> Custom Box</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="portfolio-pagination">
              {page > 1 && (
                <Link
                  href={`/p/${params.slug}/products?page=${page - 1}${category ? `&category=${category}` : ''}`}
                >
                  <ChevronLeft size={16} />
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/p/${params.slug}/products?page=${n}${category ? `&category=${category}` : ''}`}
                  className={n === page ? 'active' : ''}
                >
                  {n}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/p/${params.slug}/products?page=${page + 1}${category ? `&category=${category}` : ''}`}
                >
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
