// components/AdminLayout.jsx
'use client';

import Sidebar from './Sidebar'; // hoặc SidebarAdmin, tùy anh đang đặt tên

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar-admin">
        <Sidebar />
      </aside>

      {/* Nội dung chính */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
