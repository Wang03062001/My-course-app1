// app/api/profile/route.js
import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { verifyToken, verifyPassword, hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

// Lấy payload user từ token
function getUserFromReq(req) {
  const auth = req.headers.get('authorization') || '';
  let token = null;

  if (auth.toLowerCase().startsWith('bearer ')) {
    token = auth.slice(7).trim();
  }
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;
  return decoded; // { id, username, role }
}

// GET /api/profile
export async function GET(req) {
  try {
    const payload = getUserFromReq(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const resUser = await dbQuery(
      `SELECT id, username, role, full_name, email, created_at
       FROM users
       WHERE id = $1`,
      [payload.id]
    );

    if (resUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: resUser.rows[0],
    });
  } catch (err) {
    console.error('PROFILE GET ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// PUT /api/profile
// body: { full_name?, email?, currentPassword?, newPassword? }
export async function PUT(req) {
  try {
    const payload = getUserFromReq(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { full_name, email, currentPassword, newPassword } = body || {};

    // Lấy user hiện tại
    const resUser = await dbQuery(
      `SELECT id, username, password_hash, role, full_name, email, created_at
       FROM users
       WHERE id = $1`,
      [payload.id]
    );

    if (resUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    const user = resUser.rows[0];

    const updates = [];
    const params = [];
    let i = 1;

    if (typeof full_name === 'string') {
      updates.push(`full_name = $${i++}`);
      params.push(full_name.trim());
    }

    if (typeof email === 'string') {
      updates.push(`email = $${i++}`);
      params.push(email.trim().toLowerCase());
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Vui lòng nhập mật khẩu hiện tại' },
          { status: 400 }
        );
      }

      const ok = await verifyPassword(currentPassword, user.password_hash);
      if (!ok) {
        return NextResponse.json(
          { error: 'Mật khẩu hiện tại không đúng' },
          { status: 400 }
        );
      }

      const newHash = await hashPassword(newPassword);
      updates.push(`password_hash = $${i++}`);
      params.push(newHash);
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có gì để cập nhật',
      });
    }

    params.push(user.id);

    await dbQuery(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${i}`,
      params
    );

    const resUpdated = await dbQuery(
      `SELECT id, username, role, full_name, email, created_at
       FROM users
       WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      user: resUpdated.rows[0],
    });
  } catch (err) {
    console.error('PROFILE PUT ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
