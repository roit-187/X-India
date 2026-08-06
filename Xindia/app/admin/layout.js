import '../admin.css';
import AdminSidebar from '@/components/admin/AdminSidebar';
import BfcacheReload from '@/components/BfcacheReload';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <BfcacheReload />
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
