'use client';

import '../styles/globals.css';
import Navbar from '../components/Navbar';
import AuthBox from '../components/AuthBox';
import { AuthProvider } from '../hooks/useAuth'; // LẤY AuthProvider từ hook
import useAuth from '../hooks/useAuth';
import { usePathname } from 'next/navigation';

/**
 * AppShell: phần dùng useAuth & usePathname, nằm BÊN TRONG AuthProvider
 */
function AppShell({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isAdminPage = pathname.startsWith('/admin');
  const isDashboardPage = pathname.startsWith('/dashboard');

  return (
    <>
      <Navbar />

      {/* Hộp signin/signup: bên phải, ngay dưới navbar, chỉ ở trang chủ khi chưa login */}
      {!loading && !user && pathname === '/' && (
        <div className="auth-box-wrapper">
          <AuthBox />
        </div>
      )}

      {/* Admin & Dashboard tự quản lý layout bằng AdminLayout */}
      {isAdminPage || isDashboardPage ? (
        children
      ) : (
        <main className="app-main">{children}</main>
      )}
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="app-body">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
