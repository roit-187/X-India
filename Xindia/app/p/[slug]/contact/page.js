import { redirect } from 'next/navigation';

export default function ContactRedirectPage({ params }) {
  redirect(`/p/${params.slug}#contact`);
}
