import { notFound } from 'next/navigation';
import { getSeller, getSellerProducts, getSellerOpportunity } from '@/lib/api';
import OverviewView from '@/components/portfolio/OverviewView';

export default async function OverviewPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const [{ products }] = await Promise.all([
    getSellerProducts(params.slug, { page: 1 }),
    getSellerOpportunity(params.slug),
  ]);
  const topProducts = (products || []).slice(0, 3);

  return (
    <OverviewView
      seller={seller}
      topProducts={topProducts}
      slug={params.slug}
    />
  );
}
