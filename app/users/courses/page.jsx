'use client';

import useAuth from '../../../hooks/useAuth';

export default function UserCourses() {
  const { user } = useAuth();

  return (
    <div className="glass-card">
      <h1 className="page-title">Khoá học của tôi</h1>
      <p className="page-subtitle">
        Danh sách khoá học bạn đang theo học sẽ hiển thị tại đây.
      </p>

      <div className="info-card">
        <h2 className="info-card-title">Chưa có khoá học</h2>
        <p className="info-card-text">Bạn chưa tham gia khoá học nào.</p>
      </div>
    </div>
  );
}
