'use client';

import '../../styles/globals.css';
import SidebarUser from '../../components/SidebarUser';

export default function UserLayout({ children }) {
  return (
    <div className="admin-layout">
      <SidebarUser />

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
