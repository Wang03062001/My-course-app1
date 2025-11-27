'use client';

import Link from 'next/link';
import useAuth from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-card">
        <p>Đang tải thông tin admin...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-card">
        <h1 className="page-title">Không có quyền</h1>
        <p className="page-subtitle">
          Chỉ admin mới được truy cập trang này.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">
        Xin chào <b>{user.username}</b>! Đây là trang tổng quan quản trị.
      </p>

      <div className="card-grid">
        <div className="info-card">
          <h2 className="info-card-title">Người dùng</h2>
          <p className="info-card-text">
            Xem và chỉnh sửa tài khoản người dùng.
          </p>
          <Link href="/admin/users" className="link-inline">
            Quản lý người dùng →
          </Link>
        </div>

        <div className="info-card">
          <h2 className="info-card-title">Khoá học</h2>
          <p className="info-card-text">Quản lý danh sách khoá học.</p>
          <Link href="/admin/courses" className="link-inline">
            Quản lý khoá học →
          </Link>
        </div>

        <div className="info-card">
          <h2 className="info-card-title">Bài học</h2>
          <p className="info-card-text">Tạo và chỉnh sửa nội dung bài học.</p>
          <Link href="/admin/lessons" className="link-inline">
            Quản lý bài học →
          </Link>
        </div>
      </div>
    </div>
  );
}
