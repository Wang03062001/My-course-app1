// app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '../../../../lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username,
      email,
      code,
      newPassword,
      confirmNewPassword,
    } = body || {};

    if (!username || !email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Thiếu dữ liệu' },
        { status: 400 }
      );
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: 'Mật khẩu xác nhận không khớp' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = Date.now();

    // Lấy user trước
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email FROM users WHERE username = ?',
        [username.trim().toLowerCase()],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    if (!user.email || user.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'Gmail không trùng khớp với user' },
        { status: 400 }
      );
    }

    // Kiểm tra mã reset
    const resetRow = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT id, code, expires_at
        FROM password_resets
        WHERE user_id = ? AND code = ?
        ORDER BY id DESC
        LIMIT 1
      `,
        [user.id, String(code).trim()],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!resetRow) {
      return NextResponse.json(
        { error: 'Mã xác nhận không đúng' },
        { status: 400 }
      );
    }

    if (resetRow.expires_at < now) {
      return NextResponse.json(
        { error: 'Mã đã hết hạn' },
        { status: 400 }
      );
    }

    // Cập nhật mật khẩu mới
    const hash = await bcrypt.hash(newPassword, 10);

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hash, user.id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Xoá mã đã dùng
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM password_resets WHERE user_id = ?',
        [user.id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    return NextResponse.json({ success: true, message: 'Đã đổi mật khẩu' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
