'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY_USER = 'auth_user';
const STORAGE_KEY_TOKEN = 'auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, username, role }
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  // Load user từ localStorage khi khởi chạy
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (err) {
      console.error('LOAD AUTH ERROR:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng nhập
  const signin = async (username, password) => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: data.error || 'Đăng nhập thất bại',
        };
      }

      const { user: userData, token: jwt } = data;

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEY_TOKEN, jwt);
      }

      setUser(userData);
      setToken(jwt);

      return { success: true };
    } catch (err) {
      console.error('SIGNIN REQUEST ERROR:', err);
      return {
        success: false,
        message: 'Lỗi kết nối server',
      };
    }
  };

  // Đăng xuất
  const signout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      }
    } catch (err) {
      console.error('SIGNOUT ERROR:', err);
    }

    setUser(null);
    setToken('');

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const value = { user, token, loading, signin, signout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook dùng trong component
export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Đề phòng dùng nhầm ngoài AuthProvider
    return {
      user: null,
      token: '',
      loading: false,
      signin: async () => ({ success: false, message: 'Auth chưa khởi tạo' }),
      signout: () => {},
    };
  }
  return ctx;
}
