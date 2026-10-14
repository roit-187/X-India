'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import BfcacheReload from '@/components/BfcacheReload';

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <div className="admin-login-shell">
        <BfcacheReload />
        {children}
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <BfcacheReload />
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
