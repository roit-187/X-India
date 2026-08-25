import { redirect } from 'next/navigation';

export default function OpportunitiesRedirectPage({ params }) {
  redirect(`/p/${params.slug}#opportunities`);
}
