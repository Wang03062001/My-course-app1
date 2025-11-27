// app/api/profile/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcrypt';

/* ===== Lấy user từ header Authorization ===== */
function getAuthUser(req) {
  const auth = req.headers.get('authorization') || '';
  let token = null;

  if (auth.toLowerCase().startsWith('bearer ')) {
    token = auth.slice(7).trim();
  }
  if (!token) return null;

  const decoded = verifyToken(token);
  // payload của bạn đang dùng: { id, username, role, ... }
  if (!decoded || !decoded.id) return null;

  return decoded;
}

/* ===== GET /api/profile – lấy thông tin user hiện tại ===== */
export async function GET(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập.' },
        { status: 401 }
      );
    }

    const db = await getDb();

    const result = await db.query(
      'SELECT id, username, role, email, full_name, created_at FROM users WHERE id = $1',
      [authUser.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy user.' },
        { status: 404 }
      );
    }

    const profile = result.rows[0];
    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error('PROFILE GET ERROR:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi lấy hồ sơ.' },
      { status: 500 }
    );
  }
}

/* ===== PUT /api/profile – cập nhật họ tên / email / mật khẩu ===== */
export async function PUT(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { full_name, email, oldPassword, newPassword } = body || {};

    const db = await getDb();

    // Lấy user hiện tại (để kiểm tra mật khẩu cũ nếu cần)
    const currentRes = await db.query(
      'SELECT id, username, password_hash FROM users WHERE id = $1',
      [authUser.id]
    );
    if (currentRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User không tồn tại.' },
        { status: 404 }
      );
    }
    const current = currentRes.rows[0];

    const sets = [];
    const values = [];
    let idx = 1;

    // Cập nhật họ tên
    if (typeof full_name === 'string') {
      sets.push(`full_name = $${idx++}`);
      values.push(full_name.trim());
    }

    // Cập nhật email
    if (typeof email === 'string') {
      sets.push(`email = $${idx++}`);
      values.push(email.trim());
    }

    // Đổi mật khẩu
    if (oldPassword || newPassword) {
      if (!oldPassword || !newPassword) {
        return NextResponse.json(
          {
            success: false,
            error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.',
          },
          { status: 400 }
        );
      }

      const ok = await bcrypt.compare(
        oldPassword,
        current.password_hash || ''
      );
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu hiện tại không đúng.' },
          { status: 400 }
        );
      }

      const hash = await bcrypt.hash(newPassword, 10);
      sets.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (sets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có gì để cập nhật.',
      });
    }

    values.push(authUser.id);

    await db.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );

    // Lấy lại profile sau khi cập nhật
    const updatedRes = await db.query(
      'SELECT id, username, role, email, full_name, created_at FROM users WHERE id = $1',
      [authUser.id]
    );

    const profile = updatedRes.rows[0];

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error('PROFILE PUT ERROR:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi cập nhật hồ sơ.' },
      { status: 500 }
    );
  }
}
