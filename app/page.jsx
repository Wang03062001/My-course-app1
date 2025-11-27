'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="page-container">

      <div className="glass-card hero-card">

  

        {/* TITLE + ICON DASHBOARD */}
        <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg 
            width="28" 
            height="28" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          Quản lý khóa học & người dùng trên trang web
        </h1>

        {/* SUBTITLE */}
        <p className="hero-subtitle">
          Đăng nhập/ đăng ký tài khoản để sử dụng
        </p>

        {/* BUTTON + ICON ARROW */}
        <div className="hero-actions">
          <Link href="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg 
              width="18" 
              height="18"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
            Vào Dashboard
          </Link>
        </div>

      </div>

    </div>
  );
}
