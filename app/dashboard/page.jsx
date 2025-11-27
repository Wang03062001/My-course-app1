'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useAuth from '../../hooks/useAuth';

/* ---------------- POPUP COMPONENT ---------------- */
function Popup({ title, children, onClose, onConfirm, confirmText = 'Xác nhận' }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h3 className="modal-title">{title}</h3>

        <div className="modal-text">{children}</div>

        {/* Hai nút cùng một dòng, nằm bên phải */}
                <div
          className="modal-actions"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          {onConfirm && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Hủy
          </button>
        </div>

      </div>
    </div>
  );
}


/* ---------------- MAIN DASHBOARD ---------------- */
export default function DashboardPage() {
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState(null);

  // Popup states
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);

  // Form states
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  const [message, setMessage] = useState('');

  /* ---------- FETCH PROFILE ---------- */
  useEffect(() => {
    if (!user) return;

    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage('Lỗi tải hồ sơ');
      });
  }, [user]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-card">Đang tải...</div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="admin-card">
          <p className="text-red-600">Chưa đăng nhập.</p>
        </div>
      </AdminLayout>
    );
  }

  /* ---------- HANDLERS ---------- */

  // Cập nhật tên
  const handleSaveName = async () => {
    setMessage('');

    if (!newFullName.trim()) {
      setMessage('Tên không được để trống');
      return;
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ full_name: newFullName })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Lỗi đổi tên');
      return;
    }

    setShowNamePopup(false);
    // Cập nhật lại state thay vì reload toàn trang (tuỳ bạn, có thể giữ reload nếu muốn)
    setProfile((prev) =>
      prev ? { ...prev, full_name: newFullName } : prev
    );
  };

  // Cập nhật email
  const handleSaveEmail = async () => {
    setMessage('');

    if (!newEmail.trim()) {
      setMessage('Email không được để trống');
      return;
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: newEmail })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Lỗi đổi email');
      return;
    }

    setShowEmailPopup(false);
    setProfile((prev) =>
      prev ? { ...prev, email: newEmail } : prev
    );
  };

  // Đổi mật khẩu
  const handleSavePassword = async () => {
    setMessage('');

    if (!oldPass || !newPass || !confirmNewPass) {
      setMessage('Nhập đầy đủ mật khẩu');
      return;
    }

    if (newPass !== confirmNewPass) {
      setMessage('Mật khẩu xác nhận không trùng');
      return;
    }

    // 🔴 ĐIỂM THAY ĐỔI QUAN TRỌNG:
    // Trước đây gọi /api/profile/change-password
    // Giờ chỉ dùng 1 API /api/profile cho cả đổi tên / email / mật khẩu
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldPassword: oldPass,
        newPassword: newPass
      })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Lỗi đổi mật khẩu');
      return;
    }

    setShowPasswordPopup(false);
    setOldPass('');
    setNewPass('');
    setConfirmNewPass('');
    setMessage('Đổi mật khẩu thành công');
  };

  /* ---------- RENDER UI ---------- */

  return (
    <AdminLayout>
      <div className="admin-card">
        <h1 className="page-title">Trang cá nhân</h1>
        <p className="page-subtitle">Quản lý thông tin tài khoản của bạn.</p>

        {message && (
          <p style={{ color: 'red', marginBottom: '10px' }}>{message}</p>
        )}

        {profile && (
          <div className="card-grid">
            {/* USERNAME */}
            <div className="info-card">
              <h2 className="info-card-title">Tên đăng nhập</h2>
              <p className="info-card-text">{profile.username}</p>
            </div>

            {/* FULL NAME */}
            <div className="info-card">
              <h2 className="info-card-title">Họ và tên</h2>
              <p className="info-card-text">
                {profile.full_name || 'Chưa có'}
              </p>
              <button
                className="btn-outline btn-sm"
                onClick={() => setShowNamePopup(true)}
              >
                Thay đổi
              </button>
            </div>

            {/* EMAIL */}
            <div className="info-card">
              <h2 className="info-card-title">Gmail</h2>
              <p className="info-card-text">
                {profile.email || 'Chưa có'}
              </p>
              <button
                className="btn-outline btn-sm"
                onClick={() => setShowEmailPopup(true)}
              >
                Thay đổi
              </button>
            </div>

            {/* ROLE */}
            <div className="info-card">
              <h2 className="info-card-title">Quyền hạn</h2>
              <p className="info-card-text">{profile.role}</p>
            </div>

            {/* CREATED AT */}
            <div className="info-card">
              <h2 className="info-card-title">Ngày tạo</h2>
              <p className="info-card-text">
                {new Date(profile.created_at).toLocaleString()}
              </p>
            </div>

            {/* PASSWORD */}
            <div className="info-card">
              <h2 className="info-card-title">Mật khẩu</h2>
              <p className="info-card-text">••••••••••••</p>
              <button
                className="btn-outline btn-sm"
                onClick={() => setShowPasswordPopup(true)}
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP ĐỔI TÊN */}
      {showNamePopup && (
  <Popup
    title="Thay đổi họ và tên"
    onClose={() => setShowNamePopup(false)}
    onConfirm={handleSaveName}
    confirmText="Lưu"
  >
    <input
      className="auth-input-small"
      placeholder="Tên mới"
      value={newFullName}
      onChange={(e) => setNewFullName(e.target.value)}
    />
  </Popup>
)}


      {/* POPUP ĐỔI EMAIL */}
      {showEmailPopup && (
  <Popup
    title="Thay đổi Gmail"
    onClose={() => setShowEmailPopup(false)}
    onConfirm={handleSaveEmail}
    confirmText="Lưu"
  >
    <input
      className="auth-input-small"
      placeholder="Gmail mới"
      value={newEmail}
      onChange={(e) => setNewEmail(e.target.value)}
      type="email"
    />
  </Popup>
)}


      {/* POPUP ĐỔI PASSWORD */}
      {showPasswordPopup && (
  <Popup
    title="Đổi mật khẩu"
    onClose={() => setShowPasswordPopup(false)}
    onConfirm={handleSavePassword}
    confirmText="Đổi mật khẩu"
  >
    <input
      type="password"
      className="auth-input-small"
      placeholder="Mật khẩu hiện tại"
      value={oldPass}
      onChange={(e) => setOldPass(e.target.value)}
    />
    <input
      type="password"
      className="auth-input-small"
      placeholder="Mật khẩu mới"
      value={newPass}
      onChange={(e) => setNewPass(e.target.value)}
    />
    <input
      type="password"
      className="auth-input-small"
      placeholder="Xác nhận mật khẩu mới"
      value={confirmNewPass}
      onChange={(e) => setConfirmNewPass(e.target.value)}
    />
  </Popup>
)}

    </AdminLayout>
  );
}
