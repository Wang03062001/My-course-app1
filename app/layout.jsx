'use client';

import '../styles/globals.css';
import Navbar from '../components/Navbar';
import AuthBox from '../components/AuthBox';
import { AuthProvider } from '../hooks/useAuth';
import useAuth from '../hooks/useAuth';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// ✅ Import supabase client (ANON) để debug
import { supabase } from '../lib/supabaseClient';

/**
 * AppShell: phần dùng useAuth & usePathname, nằm BÊN TRONG AuthProvider
 */
function AppShell({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isAdminPage = pathname.startsWith('/admin');
  const isDashboardPage = pathname.startsWith('/dashboard');

  // ✅ Full-width pages (không bị bọc bởi .app-main)
  const isCoursesPage = pathname.startsWith('/courses');
  const isLessonsPage = pathname.startsWith('/lessons');

  // ✅ Expose supabase ra window để test trong DevTools Console
  useEffect(() => {
    const debugEnabled =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_DEBUG_SUPABASE === '1';

    if (!debugEnabled) return;

    // window.supabase chỉ phục vụ debug
    window.supabase = supabase;

    // Optional: log nhẹ để biết đã gắn
    // console.log('Debug: window.supabase is ready');
  }, []);

  return (
    <>
      <Navbar />

      {/* AuthBox overlay: chỉ ở trang chủ khi chưa login */}
      {!loading && !user && pathname === '/' && (
        <div className="auth-box-wrapper">
          <AuthBox />
        </div>
      )}

      {/* Admin & Dashboard tự quản lý layout bằng AdminLayout */}
      {isAdminPage || isDashboardPage ? (
        children
      ) : isCoursesPage || isLessonsPage ? (
        // ✅ Courses + Lessons: full width wrapper
        <main className="wide-main">{children}</main>
      ) : pathname === '/' ? (
        // ✅ Home: full width wrapper
        <main className="home-main">{children}</main>
      ) : (
        // Các trang thường khác
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
