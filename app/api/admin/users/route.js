// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getAdminPayload(req) {
  // Lấy token từ header Authorization
  const auth = req.headers.get('authorization') || '';
  let token = null;

  if (auth.toLowerCase().startsWith('bearer ')) {
    token = auth.slice(7).trim();
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') return null;

  return decoded;
}

export async function GET(req) {
  try {
    const admin = getAdminPayload(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Không có quyền' },
        { status: 403 }
      );
    }

    const db = await getDb();
    const users = await new Promise((resolve, reject) => {
  db.all(
    'SELECT id, username, role, email, full_name, created_at FROM users ORDER BY id ASC',
    (err, rows) => (err ? reject(err) : resolve(rows || []))
  );
});

    return NextResponse.json({ users });
  } catch (err) {
    console.error('GET USERS ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
