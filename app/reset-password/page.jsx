'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="page-container" style={{ maxWidth: 480, margin: '2rem auto' }}>
        <div className="glass-card">
          <h1 className="page-title">Đặt lại mật khẩu</h1>
          <p className="auth-message-small">
            Token không hợp lệ. Vui lòng yêu cầu lại đường link đặt lại mật khẩu.
          </p>
          <Link href="/forgot-password" className="btn btn-primary">
            Quay lại trang quên mật khẩu
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setMessage('');
    setErrorMsg('');

    if (!password || !confirm) {
      setErrorMsg('Vui lòng nhập đầy đủ mật khẩu và xác nhận.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || 'Đặt lại mật khẩu thất bại.');
        return;
      }

      setMessage(
        data.message || 'Đã đặt lại mật khẩu thành công. Bạn có thể đăng nhập.'
      );

      // Tự động quay lại trang chủ sau vài giây (tuỳ thích)
      setTimeout(() => {
        router.push('/');
      }, 2500);
    } catch (err) {
      console.error('RESET ERROR:', err);
      setErrorMsg('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 480, margin: '2rem auto' }}>
      <div className="glass-card">
        <h1 className="page-title">Đặt mật khẩu mới</h1>
        <p className="page-subtitle">
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field-small">
            <label className="auth-label-small" htmlFor="reset-password">
              Mật khẩu mới
            </label>
            <input
              id="reset-password"
              className="auth-input-small"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="auth-field-small">
            <label className="auth-label-small" htmlFor="reset-confirm">
              Xác nhận mật khẩu mới
            </label>
            <input
              id="reset-confirm"
              className="auth-input-small"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? 'Đang đặt lại...' : 'Đặt mật khẩu mới'}
          </button>
        </form>
      </div>
    </div>
  );
}
