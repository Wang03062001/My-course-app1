// app/api/auth/reset/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = (await req.json().catch(() => null)) || {};

    const usernameRaw = body.username ?? '';
    const emailRaw = body.email ?? '';
    const codeRaw = body.code ?? '';
    // chấp nhận cả newPassword lẫn password (phòng code cũ)
    const rawNewPassword = body.newPassword ?? body.password ?? '';

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

    // 1. Tìm user theo username (không phân biệt hoa thường)
    const userRes = await db.query(
      'SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    const user = userRes.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    // 2. Kiểm tra email trùng khớp
    const dbEmail = (user.email || '').trim().toLowerCase();
    if (!dbEmail || dbEmail !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Gmail không trùng khớp với user này' },
        { status: 400 }
      );
    }

    // 3. Lấy mã reset mới nhất của user
    const codeRes = await db.query(
      `SELECT id, code, expires_at
       FROM password_reset_codes
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );
    const record = codeRes.rows[0];

    if (!record) {
      return NextResponse.json(
        {
          error:
            'Không tìm thấy mã đặt lại mật khẩu. Hãy yêu cầu mã mới.',
        },
        { status: 400 }
      );
    }

    // 4. Kiểm tra hết hạn
    const now = Date.now();
    const expiresAt = Number(record.expires_at ?? 0);
    if (Number.isFinite(expiresAt) && now > expiresAt) {
      return NextResponse.json(
        { error: 'Mã đã hết hạn. Hãy yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    // 5. Kiểm tra mã đúng
    if (record.code !== code) {
      return NextResponse.json(
        { error: 'Mã xác nhận không đúng' },
        { status: 400 }
      );
    }

    // 6. Hash mật khẩu mới
    const hash = await bcrypt.hash(newPassword, 10);

    // 7. Cập nhật mật khẩu user
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hash, user.id]
    );

    // 8. Xoá toàn bộ mã reset của user (tránh dùng lại)
    await db.query(
      'DELETE FROM password_reset_codes WHERE user_id = $1',
      [user.id]
    );

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
