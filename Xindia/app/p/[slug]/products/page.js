import { redirect } from 'next/navigation';

export default function ProductsRedirectPage({ params }) {
  redirect(`/p/${params.slug}#products`);
}
