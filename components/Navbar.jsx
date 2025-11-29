'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const { user, signout, token } = useAuth();
  const pathname = usePathname();

  // ================== STATE ==================
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    users: [],
    courses: [],
    lessons: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [theme, setTheme] = useState('light');

  const searchWrapperRef = useRef(null);

  // Reset search khi đổi route
  useEffect(() => {
    setQuery('');
    setResults({ users: [], courses: [], lessons: [] });
    setShowResults(false);
    setSearchError('');
  }, [pathname]);

  // ================== THEME ==================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
      return;
    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initial = prefersDark ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);

    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
  };

  // Đóng dropdown search khi click ra ngoài
  useEffect(() => {
    const handleClick = (e) => {
      if (!searchWrapperRef.current) return;
      if (!searchWrapperRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ================== HANDLE SEARCH ==================
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setResults({ users: [], courses: [], lessons: [] });
      setShowResults(false);
      setSearchError('');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || 'Lỗi tìm kiếm');
        setResults({ users: [], courses: [], lessons: [] });
        setShowResults(true);
        return;
      }

      setResults({
        users: data.users || [],
        courses: data.courses || [],
        lessons: data.lessons || [],
      });
      setShowResults(true);
    } catch (err) {
      console.error('SEARCH CLIENT ERROR:', err);
      setSearchError('Lỗi kết nối server');
      setResults({ users: [], courses: [], lessons: [] });
      setShowResults(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const totalResults =
    (results.users?.length || 0) +
    (results.courses?.length || 0) +
    (results.lessons?.length || 0);

  return (
    <header className="navbar-floating">
      {/* THÊM main-navbar vào đây để CSS flex dùng chung */}
      <div className="navbar-floating-inner main-navbar">
        {/* TRÁI: Trang chủ + Dashboard */}
        <div className="navbar-left">
          <Link href="/" className="navbar-nav-link">
            Trang chủ
          </Link>
          <Link href="/dashboard" className="navbar-nav-link">
            Dashboard
          </Link>
        </div>

        {/* GIỮA: Search */}
        <div className="navbar-center" ref={searchWrapperRef}>
          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <span className="navbar-search-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="6" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
            </span>
            <input
              className="navbar-search-input"
              type="text"
              placeholder="Tìm user (tên, email, role), khoá học, bài học..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          {showResults && (
            <div className="navbar-search-results">
              {searchLoading && (
                <div className="navbar-search-empty">Đang tìm...</div>
              )}

              {!searchLoading && searchError && (
                <div className="navbar-search-empty error">
                  {searchError}
                </div>
              )}

              {!searchLoading &&
                !searchError &&
                totalResults === 0 && (
                  <div className="navbar-search-empty">
                    Không tìm thấy kết quả phù hợp
                  </div>
                )}

              {/* ==== USERS ==== */}
              {!searchLoading &&
                !searchError &&
                results.users?.length > 0 && (
                  <>
                    <div className="navbar-search-section-title">
                      Người dùng
                    </div>
                    {results.users.map((u) => (
                      <div key={`user-${u.id}`} className="navbar-search-item">
                        <div className="navbar-search-avatar">
                          {u.username?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="navbar-search-text">
                          <span className="navbar-search-name">
                            {u.username}
                          </span>
                          <span className="navbar-search-meta">
                            {u.email ? `${u.email} · ` : ''}
                            role: <b>{u.role}</b>
                          </span>
                        </div>
                        <span className="navbar-search-tag">user</span>
                      </div>
                    ))}
                  </>
                )}

              {/* ==== COURSES ==== */}
              {!searchLoading &&
                !searchError &&
                results.courses?.length > 0 && (
                  <>
                    <div className="navbar-search-section-title">
                      Khoá học
                    </div>
                    {results.courses.map((c) => (
                      <div
                        key={`course-${c.id}`}
                        className="navbar-search-item"
                      >
                        <div className="navbar-search-avatar">
                          {c.title?.charAt(0)?.toUpperCase() ||
                            c.name?.charAt(0)?.toUpperCase() ||
                            'C'}
                        </div>
                        <div className="navbar-search-text">
                          <span className="navbar-search-name">
                            {c.title || c.name || `Khoá ${c.id}`}
                          </span>
                          <span className="navbar-search-meta">
                            {c.code ? `Mã: ${c.code}` : 'Khoá học trong hệ thống'}
                          </span>
                        </div>
                        <span className="navbar-search-tag">course</span>
                      </div>
                    ))}
                  </>
                )}

              {/* ==== LESSONS ==== */}
              {!searchLoading &&
                !searchError &&
                results.lessons?.length > 0 && (
                  <>
                    <div className="navbar-search-section-title">
                      Bài học
                    </div>
                    {results.lessons.map((l) => (
                      <div
                        key={`lesson-${l.id}`}
                        className="navbar-search-item"
                      >
                        <div className="navbar-search-avatar">
                          {l.title?.charAt(0)?.toUpperCase() || 'L'}
                        </div>
                        <div className="navbar-search-text">
                          <span className="navbar-search-name">
                            {l.title || `Bài học ${l.id}`}
                          </span>
                          <span className="navbar-search-meta">
                            {l.course_id
                              ? `Thuộc khoá học ID: ${l.course_id}`
                              : 'Bài học trong hệ thống'}
                          </span>
                        </div>
                        <span className="navbar-search-tag">lesson</span>
                      </div>
                    ))}
                  </>
                )}
            </div>
          )}
        </div>

        {/* PHẢI: đổi theme + user + logout */}
        <div className="navbar-right">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng / tối"
          >
            {theme === 'light' ? (
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                stroke="currentColor"
                strokeWidth="1.7"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                stroke="currentColor"
                strokeWidth="1.7"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              <span className="navbar-user-name">{user.username}</span>
              <button className="navbar-logout" onClick={signout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <span className="nav-guest-text">Bạn chưa đăng nhập</span>
          )}
        </div>
      </div>
    </header>
  );
}
