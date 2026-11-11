import { redirect } from 'next/navigation';

export default function SellerPortfolioHomeRedirect({ params, searchParams }) {
  const source = typeof searchParams?.src === 'string' && ['qr', 'direct_share', 'app', 'search'].includes(searchParams.src)
    ? `?src=${encodeURIComponent(searchParams.src)}`
    : '';
  redirect(`/p/${encodeURIComponent(params.slug)}${source}#home`);
}
