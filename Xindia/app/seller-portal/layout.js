import '../seller-portal.css';
import SellerSidebar from '@/components/seller-portal/SellerSidebar';
import BfcacheReload from '@/components/BfcacheReload';

export default function SellerPortalLayout({ children }) {
  return (
    <div className="seller-shell">
      <BfcacheReload />
      <SellerSidebar />
      <main className="seller-main">{children}</main>
    </div>
  );
}
