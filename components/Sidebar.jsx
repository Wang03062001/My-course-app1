'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuth from '../hooks/useAuth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading, signout } = useAuth();

  if (loading || !user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <aside className="admin-sidebar">
      <h2 className="admin-sidebar-title">Bảng điều khiển</h2>
      <p className="admin-sidebar-subtitle">
        Xin chào, <strong>{user.username}</strong>
      </p>

      <nav className="admin-sidebar-nav">
        <Link
          href="/dashboard"
          className={pathname === '/dashboard' ? 'admin-nav-active' : ''}
        >
          Dashboard
        </Link>

        <Link
          href="/courses"
          className={pathname.startsWith('/admin/courses') ? 'admin-nav-active' : ''}
        >
          Quản lý khoá học
        </Link>

        <Link
          href="/lessons"
          className={pathname.startsWith('/admin/lessons') ? 'admin-nav-active' : ''}
        >
          Quản lý lessons
        </Link>

        {isAdmin && (
          <Link
            href="/admin/users"
            className={pathname.startsWith('/admin/users') ? 'admin-nav-active' : ''}
          >
            Quản lý users
          </Link>
        )}
      </nav>

      <button
  className="btn btn-ghost btn-sm sidebar-logout"
  onClick={signout}
>
  Đăng xuất
</button>

    </aside>
  );
}
