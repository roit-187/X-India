import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeller, getSellerProducts } from '@/lib/api';

export const metadata = { title: 'Products — XINDIA' };

export default async function ProductsPage({ params, searchParams }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const page = Math.max(parseInt(searchParams?.page) || 1, 1);
  const category = searchParams?.category;
  const { products, totalPages } = await getSellerProducts(params.slug, { page, category });

  return (
    <div className="portfolio-container">
      <h2 className="portfolio-section-title">Products from {seller.name}</h2>

      {(!products || products.length === 0) ? (
        <div className="portfolio-empty-state">No products listed yet.</div>
      ) : (
        <>
          <div className="portfolio-product-grid">
            {products.map((p) => {
              const custOpts = p.customizationOptions || {};
              const hasLogo = custOpts.logoCustomization || custOpts.customLogo;
              const hasPkg = custOpts.packagingCustomization || custOpts.customPackaging;

              return (
                <div key={p._id} className="portfolio-product-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.name} className="portfolio-product-image" />
                  <div className="portfolio-product-body">
                    <p className="portfolio-product-name">{p.name}</p>
                    <p className="portfolio-product-price">
                      {p.price} {p.unit ? <span style={{ fontSize: 12, color: 'var(--p-text-med)' }}>/ {p.unit}</span> : ''}
                    </p>
                    <div className="portfolio-product-meta-row">
                      <p className="portfolio-product-moq">MOQ: {p.moq}</p>
                      {p.deliveryTime && (
                        <span className="portfolio-product-dispatch">⚡ {p.deliveryTime}</span>
                      )}
                    </div>
                    {(hasLogo || hasPkg) && (
                      <div className="portfolio-product-custom-tags">
                        {hasLogo && <span className="portfolio-custom-tag">🏷️ Custom Logo</span>}
                        {hasPkg && <span className="portfolio-custom-tag">📦 Custom Box</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="portfolio-pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/p/${params.slug}/products?page=${n}${category ? `&category=${category}` : ''}`}
                  className={n === page ? 'active' : ''}
                >
                  {n}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
