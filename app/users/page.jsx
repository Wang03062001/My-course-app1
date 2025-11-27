'use client';

import useAuth from '../../hooks/useAuth';

// Không cho Next.js prerender static, luôn render động
export const dynamic = 'force-dynamic';

export default function UsersPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-card">
        <h1 className="admin-title">Trang người dùng</h1>
        <p>Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  // Khi chưa đăng nhập (hoặc token hết hạn) thì không được đụng user.username
  if (!user) {
    return (
      <div className="admin-card">
        <h1 className="admin-title">Trang người dùng</h1>
        <p>Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin.</p>
      </div>
    );
  }

  // Chỉ khi chắc chắn có user mới dùng user.username
  return (
    <div className="admin-card">
      <h1 className="admin-title">Xin chào, {user.username}</h1>

      <div style={{ marginTop: '1rem', lineHeight: 1.6 }}>
        <p><b>Họ và tên:</b> {user.full_name || '-'}</p>
        <p><b>Email:</b> {user.email || '-'}</p>
        <p><b>Role:</b> {user.role}</p>
      </div>
    </div>
  );
}
