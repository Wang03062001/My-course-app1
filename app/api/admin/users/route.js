// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

function getAdminFromReq(req) {
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

// GET /api/admin/users
export async function GET(req) {
  try {
    const admin = getAdminFromReq(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Không có quyền' },
        { status: 403 }
      );
    }

    const res = await dbQuery(
      `SELECT id, username, role, full_name, email, created_at
       FROM users
       ORDER BY id ASC`
    );

    return NextResponse.json({
      success: true,
      users: res.rows,
    });
  } catch (err) {
    console.error('ADMIN USERS GET ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// POST /api/admin/users
export async function POST(req) {
  try {
    const admin = getAdminFromReq(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Không có quyền' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, password, role, full_name, email } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập username và password' },
        { status: 400 }
      );
    }

    const usernameNorm = username.trim().toLowerCase();
    const emailNorm = email ? email.trim().toLowerCase() : null;
    const finalRole = (role || 'user').trim();

    const existing = await dbQuery(
      'SELECT id FROM users WHERE username = $1',
      [usernameNorm]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username đã tồn tại' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const insertRes = await dbQuery(
      `INSERT INTO users (username, password_hash, role, full_name, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, role, full_name, email, created_at`,
      [usernameNorm, passwordHash, finalRole, full_name || null, emailNorm]
    );

    return NextResponse.json({
      success: true,
      user: insertRes.rows[0],
    });
  } catch (err) {
    console.error('ADMIN USERS POST ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
