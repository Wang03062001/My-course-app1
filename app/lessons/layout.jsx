'use client';

import Sidebar from '../../components/Sidebar';

export default function LessonsLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">{children}</div>
    </div>
  );
}
