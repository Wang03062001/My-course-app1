'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setMessage('');
    setErrorMsg('');

    if (!username) {
      setErrorMsg('Vui lòng nhập tên đăng nhập (email).');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || 'Có lỗi xảy ra.');
        return;
      }

      setMessage(
        data.message ||
          'Nếu tài khoản tồn tại, link đặt lại mật khẩu đã được gửi vào email.'
      );
    } catch (err) {
      console.error('FORGOT ERROR:', err);
      setErrorMsg('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 480, margin: '2rem auto' }}>
      <div className="glass-card">
        <h1 className="page-title">Quên mật khẩu</h1>
        <p className="page-subtitle">
          Nhập tên đăng nhập (thường là email Gmail) để nhận link đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field-small">
            <label className="auth-label-small" htmlFor="forgot-username">
              Tên đăng nhập / Email
            </label>
            <input
              id="forgot-username"
              className="auth-input-small"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="auth-message-small" style={{ marginBottom: '0.5rem' }}>
              {errorMsg}
            </div>
          )}

          {message && (
            <div
              className="auth-message-small"
              style={{ marginBottom: '0.5rem', color: '#15803d' }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-small"
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
          </button>
        </form>

        <p className="auth-helper-text" style={{ marginTop: '1rem' }}>
          <Link href="/" className="auth-helper-link">
            ← Quay lại trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
