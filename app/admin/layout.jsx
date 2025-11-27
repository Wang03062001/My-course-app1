'use client';

import Sidebar from '../../components/Sidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}
