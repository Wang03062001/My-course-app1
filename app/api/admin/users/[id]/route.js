// app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { verifyToken } from '../../../../../lib/auth';
import bcrypt from 'bcrypt';

// Lấy payload từ token và kiểm tra admin
function getAdminPayload(req) {
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

/* =============== UPDATE USER =============== */
/**
 * Hỗ trợ:
 *  - full_name: đổi họ tên
 *  - email: đổi gmail
 *  - role: đổi quyền (nếu cần)
 *  - newPassword: đặt mật khẩu mới
 */
export async function PUT(req, { params }) {
  try {
    const admin = getAdminPayload(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Không có quyền' },
        { status: 403 }
      );
    }

    // ⬇️ params là Promise => cần await
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id, 10);

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID user không hợp lệ' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { full_name, email, role, newPassword } = body || {};

    const db = await getDb();

    // Lấy user hiện tại
    const current = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, role FROM users WHERE id = ?',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });

    if (!current) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    const updates = [];
    const paramsArr = [];

    // Đổi họ tên
    if (typeof full_name === 'string') {
      updates.push('full_name = ?');
      paramsArr.push(full_name.trim());
    }

    // Đổi email
    if (typeof email === 'string') {
      updates.push('email = ?');
      paramsArr.push(email.trim());
    }

    // Đổi role (nếu cần)
    if (typeof role === 'string') {
      updates.push('role = ?');
      paramsArr.push(role.trim());
    }

    // Đặt mật khẩu mới (tuỳ chọn)
    if (typeof newPassword === 'string' && newPassword.trim()) {
      const hash = await bcrypt.hash(newPassword.trim(), 10);
      updates.push('password_hash = ?');
      paramsArr.push(hash);
    }

    // Không có gì để cập nhật
    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có gì để cập nhật',
      });
    }

    paramsArr.push(userId);

    // Cập nhật DB
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        paramsArr,
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Lấy lại user sau khi update để trả về cho FE
    const updated = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, role, email, full_name, created_at FROM users WHERE id = ?',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error('UPDATE USER ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

/* =============== DELETE USER =============== */
export async function DELETE(req, { params }) {
  try {
    const admin = getAdminPayload(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Không có quyền' },
        { status: 403 }
      );
    }

    // ⬇️ params là Promise => cần await
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id, 10);

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID user không hợp lệ' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Không cho xoá admin cuối cùng
    const current = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, role FROM users WHERE id = ?',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });

    if (!current) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    if (current.role === 'admin') {
      const count = await new Promise((resolve, reject) => {
        db.get(
          "SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'",
          [],
          (err, row) => (err ? reject(err) : resolve(row?.cnt || 0))
        );
      });

      if (count <= 1) {
        return NextResponse.json(
          {
            error:
              'Không thể xoá admin cuối cùng. Hệ thống phải có ít nhất 1 admin.',
          },
          { status: 400 }
        );
      }
    }

    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM users WHERE id = ?',
        [userId],
        (err) => (err ? reject(err) : resolve())
      );
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE USER ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
