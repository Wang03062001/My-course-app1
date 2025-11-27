'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useAuth from '../../hooks/useAuth';

/* ===== Helper format ngày tạo ===== */
function formatCreatedAt(value) {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  } catch {
    return value;
  }
}

/* ===== Popup chung ===== */
function Popup({ title, children, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h3 className="modal-title">{title}</h3>
        <div className="modal-text">{children}</div>

        <div className="modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Trang Dashboard user ===== */
export default function DashboardPage() {
  const { user, token, loading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [msg, setMsg] = useState('');

  // popup & state cho sửa tên
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [newFullName, setNewFullName] = useState('');

  // popup & state cho sửa email
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // popup & state cho đổi mật khẩu
  const [showPassPopup, setShowPassPopup] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  const [saving, setSaving] = useState(false);

  /* ----- Load profile hiện tại ----- */
  useEffect(() => {
    if (!token) return;

    setMsg('');
    fetch('/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
        } else {
          setMsg(data.error || 'Không tải được hồ sơ.');
        }
      })
      .catch(() => {
        setMsg('Lỗi kết nối server.');
      });
  }, [token]);

  /* ----- Trạng thái loading / chưa login ----- */
  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-card">Đang tải...</div>
      </AdminLayout>
    );
  }

  if (!user || !token) {
    return (
      <AdminLayout>
        <div className="admin-card">
          <p className="text-red-600">Chưa đăng nhập.</p>
        </div>
      </AdminLayout>
    );
  }

  /* ===== HANDLERS ===== */

  // Cập nhật họ tên
  const handleSaveName = async () => {
    if (!newFullName.trim()) {
      setMsg('Tên không được để trống.');
      return;
    }
    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: newFullName.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg(data.error || 'Cập nhật tên thất bại.');
      } else {
        setProfile(data.profile);
        setShowNamePopup(false);
        setMsg('Đã cập nhật họ tên.');
      }
    } catch (e) {
      console.error(e);
      setMsg('Lỗi kết nối server.');
    } finally {
      setSaving(false);
    }
  };

  // Cập nhật Gmail
  const handleSaveEmail = async () => {
    if (!newEmail.trim()) {
      setMsg('Gmail không được để trống.');
      return;
    }
    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg(data.error || 'Cập nhật Gmail thất bại.');
      } else {
        setProfile(data.profile);
        setShowEmailPopup(false);
        setMsg('Đã cập nhật Gmail.');
      }
    } catch (e) {
      console.error(e);
      setMsg('Lỗi kết nối server.');
    } finally {
      setSaving(false);
    }
  };

  // Đổi mật khẩu
  const handleSavePassword = async () => {
    if (!oldPass || !newPass || !confirmNewPass) {
      setMsg('Vui lòng nhập đầy đủ mật khẩu cũ, mới và xác nhận.');
      return;
    }
    if (newPass !== confirmNewPass) {
      setMsg('Mật khẩu mới và xác nhận không khớp.');
      return;
    }

    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: oldPass,
          newPassword: newPass,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg(data.error || 'Đổi mật khẩu thất bại.');
      } else {
        setShowPassPopup(false);
        setOldPass('');
        setNewPass('');
        setConfirmNewPass('');
        setMsg('Đổi mật khẩu thành công.');
      }
    } catch (e) {
      console.error(e);
      setMsg('Lỗi kết nối server.');
    } finally {
      setSaving(false);
    }
  };

  /* ===== RENDER ===== */

  return (
    <AdminLayout>
      <div className="admin-card">
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h1 className="admin-title">Dashboard người dùng</h1>
        </div>

        {msg && <div className="admin-alert">{msg}</div>}

        {!profile && (
          <p>Không tìm thấy thông tin tài khoản. Vui lòng thử lại sau.</p>
        )}

        {profile && (
          <>
            <table className="admin-table">
              <tbody>
                <tr>
                  <th style={{ width: 160 }}>Username</th>
                  <td>{profile.username}</td>
                </tr>
                <tr>
                  <th>Họ và tên</th>
                  <td>{profile.full_name || '-'}</td>
                </tr>
                <tr>
                  <th>Gmail</th>
                  <td>{profile.email || '-'}</td>
                </tr>
                <tr>
                  <th>Role</th>
                  <td>{profile.role}</td>
                </tr>
                <tr>
                  <th>Ngày tạo</th>
                  <td>{formatCreatedAt(profile.created_at)}</td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setNewFullName(profile.full_name || '');
                  setShowNamePopup(true);
                }}
              >
                Sửa họ tên
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setNewEmail(profile.email || '');
                  setShowEmailPopup(true);
                }}
              >
                Sửa Gmail
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowPassPopup(true)}
              >
                Đổi mật khẩu
              </button>
            </div>
          </>
        )}
      </div>

      {/* Popup sửa họ tên */}
      {showNamePopup && (
        <Popup title="Cập nhật họ và tên" onClose={() => setShowNamePopup(false)}>
          <p className="mb-2 text-sm text-gray-600">
            Nhập họ và tên mới của bạn:
          </p>
          <input
            className="auth-input-small"
            placeholder="Họ và tên"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
          />
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveName}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </Popup>
      )}

      {/* Popup sửa Gmail */}
      {showEmailPopup && (
        <Popup title="Cập nhật Gmail" onClose={() => setShowEmailPopup(false)}>
          <p className="mb-2 text-sm text-gray-600">
            Nhập Gmail mới của bạn:
          </p>
          <input
            className="auth-input-small"
            type="email"
            placeholder="Gmail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveEmail}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </Popup>
      )}

      {/* Popup đổi mật khẩu */}
      {showPassPopup && (
        <Popup title="Đổi mật khẩu" onClose={() => setShowPassPopup(false)}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
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
          </div>

          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSavePassword}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </Popup>
      )}
    </AdminLayout>
  );
}
