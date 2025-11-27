'use client';

import '../../styles/globals.css';
import Sidebar from '../../components/Sidebar';

export default function UserLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
