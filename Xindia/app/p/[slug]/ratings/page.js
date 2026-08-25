import { redirect } from 'next/navigation';

export default function RatingsRedirectPage({ params }) {
  redirect(`/p/${params.slug}#ratings`);
}
