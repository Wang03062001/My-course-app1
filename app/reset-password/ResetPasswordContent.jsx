// app/reset-password/ResetPasswordContent.jsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  // 👉 phần dưới này thay bằng code cũ của bạn trong page.jsx
  // (form nhập mật khẩu mới, gọi API, v.v.)
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    if (!password || !confirm) {
      setMsg('Vui lòng nhập đầy đủ mật khẩu.');
      return;
    }
    if (password !== confirm) {
      setMsg('Mật khẩu không khớp.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || 'Đổi mật khẩu thất bại.');
      } else {
        setMsg('Đổi mật khẩu thành công, hãy đăng nhập lại.');
      }
    } catch (err) {
      console.error(err);
      setMsg('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Đặt lại mật khẩu</h1>
      {!token && (
        <p style={{ color: 'red' }}>Thiếu token đặt lại mật khẩu.</p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="auth-input"
        />

        <button type="submit" className="btn btn-primary" disabled={loading || !token}>
          {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>
      </form>

      {msg && <div className="auth-message">{msg}</div>}
    </div>
  );
}
