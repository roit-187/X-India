'use client';

import { useMemo, useState } from 'react';
import PortfolioImage from './PortfolioImage';
import { resolveImageUrl } from '@/lib/image';

export default function PublicProductGallery({ product }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = useMemo(() => {
    const raw = [product?.imageUrl, ...(Array.isArray(product?.images) ? product.images : [])]
      .filter((value, index, list) => typeof value === 'string' && value.trim() && list.indexOf(value) === index);
    return raw.map((value) => resolveImageUrl(value)).filter(Boolean);
  }, [product]);
  const activeImage = images[activeIndex] || '';

  return (
    <div className="public-product-gallery">
      <div className="public-product-image-wrap">
        <PortfolioImage src={activeImage} alt={product.name || 'Product'} className="public-product-image" placeholderLabel="Product image not provided" />
      </div>
      {images.length > 1 && (
        <div className="public-product-thumbnails" aria-label="Product photos">
          {images.map((src, index) => (
            <button type="button" key={`${src}-${index}`} onClick={() => setActiveIndex(index)} className={`public-product-thumbnail ${activeIndex === index ? 'active' : ''}`} aria-label={`Show product photo ${index + 1}`} aria-pressed={activeIndex === index}>
              <PortfolioImage src={src} alt="" className="public-product-thumbnail-image" placeholderLabel="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
