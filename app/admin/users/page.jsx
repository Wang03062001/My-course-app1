'use client';

import { useEffect, useState } from 'react';
import useAuth from '../../../hooks/useAuth';

/* ========= Helper format ngày tạo ========= */
function formatCreatedAt(value) {
  if (!value) return '-';
  try {
    // SQLite: "YYYY-MM-DD HH:MM:SS"
    const isoLike = value.trim().replace(' ', 'T');
    const date = new Date(isoLike);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  } catch {
    return value;
  }
}

/* ========= Popup xác nhận ========= */
function ConfirmModal({ title, text, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-text">{text}</p>

        <div
          className="modal-actions"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          <button className="btn btn-primary btn-sm" onClick={onConfirm}>
            Xác nhận
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========= Popup chỉnh sửa user ========= */
function EditUserModal({
  user,
  fullName,
  email,
  newPassword,
  confirmPassword,
  onChangeFullName,
  onChangeEmail,
  onChangeNewPassword,
  onChangeConfirmPassword,
  onSave,
  onCancel,
  saving,
  errorMessage,        // 👈 thêm dòng này
}) {

  const [showPassword, setShowPassword] = useState(false);

  if (!user) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h3 className="modal-title">
          Sửa thông tin user: <b>{user.username}</b>
        </h3>

        {/* Nội dung popup – các dòng có gap rõ ràng */}
        <div
          className="modal-text"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
          }}
        >
          {/* Họ và tên */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>
              Họ và tên
            </label>
            <input
              className="auth-input-small"
              value={fullName}
              onChange={(e) => onChangeFullName(e.target.value)}
              placeholder="Họ và tên"
            />
          </div>

          {/* Gmail */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>
              Gmail
            </label>
            <input
              className="auth-input-small"
              type="email"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              placeholder="Gmail"
            />
          </div>

          <hr style={{ margin: '0.3rem 0 0.1rem' }} />

          {/* Mật khẩu mới */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>
              Mật khẩu mới (tuỳ chọn)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input-small"
                value={newPassword}
                onChange={(e) => onChangeNewPassword(e.target.value)}
                placeholder="Để trống nếu không đổi"
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input-small"
              value={confirmPassword}
              onChange={(e) => onChangeConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
          {/* 👇 THÊM KHỐI NÀY ĐỂ HIỂN THỊ LỖI TRONG POPUP */}
          {errorMessage && (
            <div
              style={{
                color: '#e53935',
                fontSize: '0.8rem',
                marginTop: '0.2rem',
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>

        {/* Nút Lưu + Hủy trên cùng một dòng, Lưu trước Hủy sau */}
        <div
          className="modal-actions"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          <button
            className="btn btn-primary btn-sm"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========= Trang chính ========= */
export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Xoá user
  const [confirmData, setConfirmData] = useState(null);

  // Sửa user
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [popupError, setPopupError] = useState('');


  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const loadUsers = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || 'Không tải được danh sách user');
      } else {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
      setMsg('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

    const openEditUser = (user) => {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditEmail(user.email || '');
    setEditNewPassword('');
    setEditConfirmPassword('');
    setPopupError('');  // 👈 reset lỗi cũ
  };


    const handleSaveEdit = async () => {
    if (!editingUser) return;
    setMsg('');
    setPopupError('');  // 👈 xóa lỗi cũ trong popup

    // Kiểm tra mật khẩu nếu admin muốn đổi
    if (editNewPassword || editConfirmPassword) {
      if (!editNewPassword || !editConfirmPassword) {
        setPopupError('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận.');
        return;
      }
      if (editNewPassword !== editConfirmPassword) {
        setPopupError('Mật khẩu mới và xác nhận không khớp.');
        return;
      }
    }


  setSavingEdit(true);

  try {
    const body = {
      full_name: editFullName,
      email: editEmail,
    };
    if (editNewPassword) {
      body.newPassword = editNewPassword;
    }

    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // 🔴 THÊM LOG Ở ĐÂY
    console.log('PUT /api/admin/users response status:', res.status);
    console.log('PUT /api/admin/users response data:', data);

    if (!res.ok) {
      setMsg(data.error || 'Cập nhật user thất bại');
    } else {
      const updated = data.user;
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    }
  } catch (e) {
    console.error('Lỗi fetch /api/admin/users:', e);
    setMsg('Lỗi kết nối server');
  } finally {
    setSavingEdit(false);
    setEditingUser(null); // đóng popup
  }
};


  const deleteUser = async (id) => {
    setMsg('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || 'Xoá thất bại');
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (e) {
      console.error(e);
      setMsg('Lỗi kết nối server');
    }
  };

  const openConfirmDelete = (user) => {
    setConfirmData({
      title: 'Xác nhận xoá user',
      text: `Bạn có chắc muốn xoá user '${user.username}'? Hành động này không thể hoàn tác.`,
      onConfirm: () => deleteUser(user.id),
    });
  };

  return (
    <div className="admin-users">
      <div className="admin-card">
        {/* Header card */}
        <div
          className="admin-card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h1 className="admin-title">Quản lý users</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading && <span className="admin-badge">Đang tải...</span>}
            <button className="btn btn-outline btn-sm" onClick={loadUsers}>
              Làm mới
            </button>
          </div>
        </div>

        {msg && <div className="admin-alert">{msg}</div>}

        {/* Bảng users */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>ID</th>
                <th style={{ textAlign: 'left' }}>Username</th>
                <th style={{ textAlign: 'left' }}>Họ và tên</th>
                <th style={{ textAlign: 'left' }}>Gmail</th>
                <th style={{ textAlign: 'left' }}>Role</th>
                <th style={{ textAlign: 'left' }}>Ngày tạo</th>
                <th style={{ textAlign: 'left' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    Không có user nào.
                  </td>
                </tr>
              )}

              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.full_name || '-'}</td>
                  <td>{u.email || '-'}</td>
                  <td>{u.role}</td>
                  <td>{formatCreatedAt(u.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openEditUser(u)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={currentUser && currentUser.id === u.id}
                      onClick={() => openConfirmDelete(u)}
                      style={{ marginLeft: '0.4rem' }}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup xác nhận xoá */}
      {confirmData && (
        <ConfirmModal
          title={confirmData.title}
          text={confirmData.text}
          onCancel={() => setConfirmData(null)}
          onConfirm={() => {
            confirmData.onConfirm();
            setConfirmData(null);
          }}
        />
      )}

      {/* Popup chỉnh sửa user */}
            {editingUser && (
        <EditUserModal
          user={editingUser}
          fullName={editFullName}
          email={editEmail}
          newPassword={editNewPassword}
          confirmPassword={editConfirmPassword}
          onChangeFullName={setEditFullName}
          onChangeEmail={setEditEmail}
          onChangeNewPassword={setEditNewPassword}
          onChangeConfirmPassword={setEditConfirmPassword}
          onSave={handleSaveEdit}
          onCancel={() => {
            setEditingUser(null);
            setPopupError('');   // 👈 reset lỗi khi đóng popup
          }}
          saving={savingEdit}
          errorMessage={popupError}  // 👈 truyền lỗi vào popup
        />
      )}

    </div>
  );
}
