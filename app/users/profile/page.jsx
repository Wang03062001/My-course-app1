'use client';

import useAuth from '../../../hooks/useAuth';

export default function UserProfile() {
  const { user } = useAuth();

  return (
    <div className="glass-card">
      <h1 className="page-title">Hồ sơ cá nhân</h1>
      <p className="page-subtitle">Thông tin cơ bản của tài khoản.</p>

      <div className="info-card">
        <h2 className="info-card-title">Username</h2>
        <p className="info-card-text">{user.username}</p>
      </div>

      <div className="info-card">
        <h2 className="info-card-title">Role</h2>
        <p className="info-card-text">{user.role}</p>
      </div>
    </div>
  );
}
