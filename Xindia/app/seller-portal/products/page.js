'use client';

import { useState, useEffect } from 'react';
import ProductManager from '@/components/seller-portal/ProductManager';

export default function SellerProductsPage() {
  const [sellerId, setSellerId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('seller_user_id') || '';
      setSellerId(storedId);
    }
  }, []);

  return (
    <div style={{ maxWidth: 1000 }}>
      <ProductManager sellerId={sellerId} />
    </div>
  );
}
