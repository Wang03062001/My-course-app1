'use client';

import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

export default function AuthBox() {
  const { user } = useAuth();

  // 'auth' = đăng nhập / đăng ký, 'reset' = lấy lại mật khẩu
  const [view, setView] = useState('auth'); // 'auth' | 'reset'
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'

  // --- Đăng nhập ---
  const [signinUsername, setSigninUsername] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  // --- Đăng ký ---
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // --- Lấy lại mật khẩu ---
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmNewPassword, setResetConfirmNewPassword] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  // --- Common ---
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Nếu đã đăng nhập thì ẩn AuthBox
  if (user) return null;

  // Đếm ngược nút "Lấy mã"
  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = setInterval(() => {
      setCodeCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [codeCountdown]);

  // -----------------------------
  // SWITCH VIEW / TAB
  // -----------------------------
  const switchToAuthView = () => {
    setView('auth');
    setMessage('');
    setCodeCountdown(0);
    setSendingCode(false);
    setResetUsername('');
    setResetEmail('');
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmNewPassword('');
  };

  const switchToResetView = () => {
    setView('reset');
    setMessage('');
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    setMessage('');
  };

  // -----------------------------
  // ĐĂNG NHẬP
  // -----------------------------
  const handleSignin = async (e) => {
    if (e) e.preventDefault();
    setMessage('');

    if (!signinUsername || !signinPassword) {
      setMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signinUsername.trim(),
          password: signinPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Đăng nhập thất bại');
        return;
      }

      // Lưu user + token, để useAuth đọc lại
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('auth_token', data.token);

      window.location.reload();
    } catch (err) {
      console.error('SIGNIN ERROR:', err);
      setMessage('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // ĐĂNG KÝ
  // -----------------------------
  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    setMessage('');

    if (!signupUsername || !signupPassword || !signupConfirmPassword) {
      setMessage('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupUsername.trim(),
          password: signupPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Đăng ký thất bại');
        return;
      }

      setMessage('Đăng ký thành công. Hãy đăng nhập.');
      setTab('signin');
      setSigninUsername(signupUsername.trim());
      setSigninPassword('');
    } catch (err) {
      console.error('SIGNUP ERROR:', err);
      setMessage('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // GỬI MÃ QUA EMAIL
  // -----------------------------
  const handleSendCode = async () => {
    setMessage('');

    if (!resetUsername || !resetEmail) {
      setMessage('Vui lòng nhập đủ tên user và Gmail');
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch('/api/auth/request-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: resetUsername.trim(),
          email: resetEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Không gửi được mã, hãy thử lại');
        return;
      }

      setMessage('Đã gửi mã tới Gmail. Kiểm tra hộp thư của bạn.');
      setCodeCountdown(60);
    } catch (err) {
      console.error('SEND CODE ERROR:', err);
      setMessage('Lỗi kết nối server khi gửi mã');
    } finally {
      setSendingCode(false);
    }
  };

  // ----------------------------------------------------
// HANDLER ĐỔI MẬT KHẨU (RESET)
// ----------------------------------------------------
const handleResetPassword = async (e) => {
  if (e) e.preventDefault();
  setMessage('');

  if (!resetUsername || !resetEmail || !resetCode) {
    setMessage('Vui lòng nhập đầy đủ User, Gmail và mã xác nhận');
    return;
  }

  if (!resetNewPassword || !resetConfirmNewPassword) {
    setMessage('Vui lòng nhập mật khẩu mới và xác nhận lại');
    return;
  }

  if (resetNewPassword !== resetConfirmNewPassword) {
    setMessage('Mật khẩu mới và xác nhận không khớp');
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: resetUsername.trim(),
        email: resetEmail.trim(),
        code: resetCode.trim(),
        // 👇 QUAN TRỌNG: dùng đúng key newPassword
        newPassword: resetNewPassword.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Không thể đặt lại mật khẩu');
      return;
    }

    setMessage('Đổi mật khẩu thành công. Hãy đăng nhập lại.');

    // Reset view về đăng nhập
    switchToAuthView();
    setTab('signin');
    setSigninUsername(resetUsername.trim());
    setSigninPassword('');
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    setMessage('Lỗi kết nối server khi đặt lại mật khẩu');
  } finally {
    setLoading(false);
  }
};


  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="auth-box-wrapper">
      <div className="auth-box">
        {/* VIEW ĐĂNG NHẬP / ĐĂNG KÝ */}
        {view === 'auth' && (
          <>
            <div className="auth-tabs-small">
              <button
                type="button"
                className={`auth-tab-small ${tab === 'signin' ? 'active' : ''}`}
                onClick={() => switchTab('signin')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={`auth-tab-small ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => switchTab('signup')}
              >
                Đăng ký
              </button>
            </div>

            {message && <div className="auth-message-small">{message}</div>}

            {/* TAB ĐĂNG NHẬP */}
            {tab === 'signin' && (
              <form onSubmit={handleSignin}>
                <div className="auth-field-small">
                  <label className="auth-label-small">Tên đăng nhập</label>
                  <input
                    className="auth-input-small"
                    value={signinUsername}
                    onChange={(e) => setSigninUsername(e.target.value)}
                  />
                </div>

                <div className="auth-field-small">
                  <label className="auth-label-small">Mật khẩu</label>
                  <input
                    type="password"
                    className="auth-input-small"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary auth-submit-small"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>

                <div className="auth-helper-text">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    className="auth-helper-link"
                    onClick={() => switchTab('signup')}
                  >
                    Đăng ký ngay
                  </button>
                </div>

                <div className="auth-helper-text" style={{ marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    className="auth-helper-link"
                    onClick={switchToResetView}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </form>
            )}

            {/* TAB ĐĂNG KÝ */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup}>
                <div className="auth-field-small">
                  <label className="auth-label-small">Tên đăng nhập</label>
                  <input
                    className="auth-input-small"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                  />
                </div>

                <div className="auth-field-small">
                  <label className="auth-label-small">Mật khẩu</label>
                  <input
                    type="password"
                    className="auth-input-small"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>

                <div className="auth-field-small">
                  <label className="auth-label-small">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    className="auth-input-small"
                    value={signupConfirmPassword}
                    onChange={(e) =>
                      setSignupConfirmPassword(e.target.value)
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary auth-submit-small"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng ký'}
                </button>
              </form>
            )}
          </>
        )}

        {/* VIEW LẤY LẠI MẬT KHẨU */}
        {view === 'reset' && (
          <>
            <h3
              style={{
                marginTop: 0,
                marginBottom: '0.6rem',
                fontSize: '1rem',
              }}
            >
              Lấy lại mật khẩu
            </h3>

            {message && <div className="auth-message-small">{message}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="auth-field-small">
                <label className="auth-label-small">Tên user</label>
                <input
                  className="auth-input-small"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                />
              </div>

              <div className="auth-field-small">
                <label className="auth-label-small">Gmail</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="auth-input-small"
                    style={{ flex: 1 }}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-outline auth-submit-small"
                    style={{ width: '110px', padding: '0.35rem 0.5rem' }}
                    onClick={handleSendCode}
                    disabled={sendingCode || codeCountdown > 0}
                  >
                    {codeCountdown > 0
                      ? `Lấy mã (${codeCountdown}s)`
                      : 'Lấy mã'}
                  </button>
                </div>
              </div>

              <div className="auth-field-small">
                <label className="auth-label-small">Mã xác nhận</label>
                <input
                  className="auth-input-small"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                />
              </div>

              <div className="auth-field-small">
                <label className="auth-label-small">Mật khẩu mới</label>
                <input
                  type="password"
                  className="auth-input-small"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                />
              </div>

              <div className="auth-field-small">
                <label className="auth-label-small">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  className="auth-input-small"
                  value={resetConfirmNewPassword}
                  onChange={(e) =>
                    setResetConfirmNewPassword(e.target.value)
                  }
                />
              </div>

              <button
                type="submit"
                className="btn-primary auth-submit-small"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>

              <div className="auth-helper-text" style={{ marginTop: '0.6rem' }}>
                <button
                  type="button"
                  className="auth-helper-link"
                  onClick={switchToAuthView}
                >
                  Quay lại đăng nhập / đăng ký
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
