'use client';

import useAuth from '../../hooks/useAuth';

export default function UserDashboard() {
  const { user } = useAuth();

  return (
    <div className="glass-card">
      <h1 className="page-title">User Dashboard</h1>
      <p className="page-subtitle">
        Xin chào <b>{user.username}</b>! Đây là bảng điều khiển cá nhân của bạn.
      </p>

      <div className="card-grid">
        <div className="info-card">
          <h2 className="info-card-title">Thông tin tài khoản</h2>
          <p className="info-card-text">Vai trò: {user.role}</p>
        </div>

        <div className="info-card">
          <h2 className="info-card-title">Khoá học</h2>
          <p className="info-card-text">Xem danh sách khoá học bạn đang theo học.</p>
        </div>

        <div className="info-card">
          <h2 className="info-card-title">Hồ sơ cá nhân</h2>
          <p className="info-card-text">Xem và chỉnh sửa thông tin hồ sơ.</p>
        </div>
      </div>
    </div>
  );
}
