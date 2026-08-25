import { redirect } from 'next/navigation';

export default function FactoryRedirectPage({ params }) {
  redirect(`/p/${params.slug}#factory`);
}
