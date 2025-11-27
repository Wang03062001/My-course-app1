// app/api/auth/reset/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '../../../../lib/db';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);

    const usernameRaw = body?.username ?? '';
    const emailRaw = body?.email ?? '';
    const codeRaw = body?.code ?? '';
    // chấp nhận cả newPassword lẫn password (phòng code cũ)
    const rawNewPassword = body?.newPassword ?? body?.password ?? '';

    const username = usernameRaw.toString().trim();
    const email = emailRaw.toString().trim();
    const code = codeRaw.toString().trim();
    const newPassword = rawNewPassword.toString().trim();

    if (!username || !email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ User, Gmail, mã và mật khẩu mới' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Tìm user
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email FROM users WHERE LOWER(username) = ?',
        [username.toLowerCase()],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    const dbEmail = (user.email || '').trim().toLowerCase();
    if (!dbEmail || dbEmail !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Gmail không trùng khớp với user này' },
        { status: 400 }
      );
    }

    // Lấy mã reset mới nhất
    const record = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, code, expires_at
         FROM password_reset_codes
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Không tìm thấy mã đặt lại mật khẩu. Hãy yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    const now = Date.now();
    if (now > Number(record.expires_at || 0)) {
      return NextResponse.json(
        { error: 'Mã đã hết hạn. Hãy yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    if (record.code !== code) {
      return NextResponse.json(
        { error: 'Mã xác nhận không đúng' },
        { status: 400 }
      );
    }

    // Hash mật khẩu mới
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
        'DELETE FROM password_reset_codes WHERE user_id = ?',
        [user.id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công. Hãy đăng nhập lại.',
    });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi đặt lại mật khẩu' },
      { status: 500 }
    );
  }
}
