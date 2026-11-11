import { Award, FileCheck2, ShieldCheck } from 'lucide-react';

const DOCUMENT_SIGNALS = [
  ['gst', 'GST verified', 'GST verification is recorded in XINDIA. The GSTIN is not shown publicly.', FileCheck2],
  ['cin', 'CIN verified', 'A CIN document has a verification status recorded in XINDIA.', FileCheck2],
  ['msme', 'MSME verified', 'An MSME document has a verification status recorded in XINDIA.', FileCheck2],
  ['iso', 'ISO document verified', 'An ISO document has a verification status recorded in XINDIA.', Award],
  ['fssai', 'FSSAI verified', 'An FSSAI document has a verification status recorded in XINDIA.', FileCheck2],
  ['iec', 'IEC verified', 'An IEC document has a verification status recorded in XINDIA.', FileCheck2],
];

export function getPortfolioVerificationSignals(seller) {
  if (!seller) return [];

  const signals = [];
  if (seller.verified) {
    signals.push({
      id: 'seller',
      title: 'XINDIA seller verified',
      description: 'A seller verification status is recorded in XINDIA.',
      icon: ShieldCheck,
    });
  }

  const documents = seller.verifiedDocuments || {};
  DOCUMENT_SIGNALS.forEach(([id, title, description, icon]) => {
    const documentVerified = Boolean(documents[id]?.verifiedAt);
    const sellerFieldVerified = id === 'gst' && seller.gstVerified;
    if (documentVerified || sellerFieldVerified) {
      signals.push({ id, title, description, icon });
    }
  });

  return signals;
}
