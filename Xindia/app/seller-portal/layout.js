import '../seller-portal.css';
import SellerSidebar from '@/components/seller-portal/SellerSidebar';
import AuthGuard from '@/components/AuthGuard';

export default function SellerPortalLayout({ children }) {
  return (
    <div className="seller-shell">
      <AuthGuard />
      <SellerSidebar />
      <main className="seller-main">{children}</main>
    </div>
  );
}
