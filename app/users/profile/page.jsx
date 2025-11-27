'use client';

import useAuth from '../../../hooks/useAuth';

// Không cho Next.js prerender static
export const dynamic = 'force-dynamic';

export default function UserProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-card">
        <h1 className="admin-title">Hồ sơ người dùng</h1>
        <p>Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-card">
        <h1 className="admin-title">Hồ sơ người dùng</h1>
        <p>Bạn chưa đăng nhập. Vui lòng đăng nhập để xem hồ sơ.</p>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h1 className="admin-title">Hồ sơ của: {user.username}</h1>

      <div style={{ marginTop: '1rem', lineHeight: 1.6 }}>
        <p><b>Họ và tên:</b> {user.full_name || '-'}</p>
        <p><b>Email:</b> {user.email || '-'}</p>
        <p><b>Role:</b> {user.role}</p>
        <p><b>ID:</b> {user.id}</p>
      </div>
    </div>
  );
}
