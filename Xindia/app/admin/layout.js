import '../admin.css';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuthGuard from '@/components/AuthGuard';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <AuthGuard />
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
