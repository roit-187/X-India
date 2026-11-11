'use client';

import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { resolveImageUrl } from '@/lib/image';

export default function PortfolioImage({
  src,
  alt = '',
  className = '',
  placeholderLabel = 'Image not provided',
  showPlaceholderText = true,
  ...imageProps
}) {
  const [failed, setFailed] = useState(false);
  const imageUrl = resolveImageUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (!imageUrl || failed) {
    return (
      <div
        className={`portfolio-media-placeholder ${className}`.trim()}
        role="img"
        aria-label={alt || placeholderLabel}
      >
        <ImageOff size={22} aria-hidden="true" />
        {showPlaceholderText && <span>{placeholderLabel}</span>}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...imageProps}
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
