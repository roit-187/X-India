import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import ProblemSection from '@/components/landing/ProblemSection';
import HowItWorks from '@/components/landing/HowItWorks';
import MetricsSection from '@/components/landing/MetricsSection';
import Testimonials from '@/components/landing/Testimonials';
import TrustSection from '@/components/landing/TrustSection';
import WebsiteShowcase from '@/components/landing/WebsiteShowcase';
import DownloadCTA from '@/components/landing/DownloadCTA';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <MetricsSection />
      <Testimonials />
      <TrustSection />
      <WebsiteShowcase />
      <DownloadCTA />
      <Footer />
    </>
  );
}
