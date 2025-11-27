// app/api/profile/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

// Lấy token từ header Authorization hoặc cookie "token"
function extractToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const t = authHeader.slice(7).trim();
    if (t) return t;
  }

  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  return null;
}

// Lấy user hiện tại từ token + DB
async function getCurrentUser(request, existingDb = null) {
  const token = extractToken(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;

  const db = existingDb || (await getDb());

  const user = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, role, email, full_name, created_at, password_hash FROM users WHERE id = ?',
      [payload.id],
      (err, row) => (err ? reject(err) : resolve(row || null))
    );
  });

  return user;
}

/* ---------------------- GET /api/profile ---------------------- */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('GET /api/profile error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
}

/* ---------------------- PUT /api/profile ---------------------- */
/**
 * Xử lý:
 *  - { full_name } hoặc { name }         -> đổi họ tên
 *  - { email }                           -> đổi email
 *  - { oldPassword/currentPassword, newPassword } -> đổi mật khẩu
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      full_name,
      name,
      email,
      oldPassword,
      currentPassword,
      newPassword,
    } = body || {};

    const db = await getDb();
    const user = await getCurrentUser(request, db);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const newFullName =
      typeof full_name === 'string' && full_name.trim()
        ? full_name.trim()
        : typeof name === 'string' && name.trim()
        ? name.trim()
        : null;

    const newEmail =
      typeof email === 'string' && email.trim() ? email.trim() : null;

    const hasNameOrEmailUpdate = newFullName || newEmail;
    const hasPasswordUpdate = !!newPassword;

    if (!hasNameOrEmailUpdate && !hasPasswordUpdate) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu để cập nhật' },
        { status: 400 }
      );
    }

    // 1) Cập nhật họ tên / email
    if (hasNameOrEmailUpdate) {
      const updates = [];
      const params = [];

      if (newFullName) {
        updates.push('full_name = ?');
        params.push(newFullName);
      }

      if (newEmail) {
        updates.push('email = ?');
        params.push(newEmail);
      }

      params.push(user.id);

      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          params,
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    // 2) Đổi mật khẩu (nếu có yêu cầu)
    if (hasPasswordUpdate) {
      const currentPass = oldPassword || currentPassword || null;

      if (!currentPass) {
        return NextResponse.json(
          { success: false, error: 'Vui lòng nhập mật khẩu hiện tại' },
          { status: 400 }
        );
      }

      const ok = await bcrypt.compare(currentPass, user.password_hash);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu hiện tại không đúng' },
          { status: 400 }
        );
      }

      const newHash = await bcrypt.hash(newPassword, 10);

      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [newHash, user.id],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    // 3) Lấy lại user sau khi cập nhật
    const updated = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, role, email, full_name, created_at FROM users WHERE id = ?',
        [user.id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        username: updated.username,
        role: updated.role,
        email: updated.email,
        full_name: updated.full_name,
        created_at: updated.created_at,
      },
    });
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi server' },
      { status: 500 }
    );
  }
}
