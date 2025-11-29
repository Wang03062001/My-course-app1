// app/api/auth/request-reset-code/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs'; // cần Node.js để dùng nodemailer

// Tạo transporter dùng Gmail + mật khẩu ứng dụng
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('⚠️ SMTP_USER hoặc SMTP_PASS chưa được cấu hình');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const usernameRaw = body?.username || '';
    const emailRaw = body?.email || '';

    if (!usernameRaw || !emailRaw) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ tên user và Gmail' },
        { status: 400 }
      );
    }

    const username = usernameRaw.trim().toLowerCase();
    const email = emailRaw.trim().toLowerCase();

    const db = await getDb();

    // Tạo bảng password_reset_codes nếu chưa có (Postgres)
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL
      );
    `);

    // Tìm user theo username (lowercase)
    const userRes = await db.query(
      'SELECT id, username, email FROM users WHERE LOWER(username) = $1',
      [username]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    const user = userRes.rows[0];

    // Kiểm tra Gmail có trùng với DB không
    const dbEmail = (user.email || '').trim().toLowerCase();
    if (!dbEmail || dbEmail !== email) {
      return NextResponse.json(
        { error: 'Gmail không trùng khớp với user này' },
        { status: 400 }
      );
    }

    // Xoá các mã cũ của user (nếu có)
    await db.query('DELETE FROM password_reset_codes WHERE user_id = $1', [
      user.id,
    ]);

    // Tạo mã 6 số, hiệu lực 10 phút
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 phút

    await db.query(
      `INSERT INTO password_reset_codes (user_id, code, expires_at, created_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, code, expiresAt, now]
    );

    // Gửi mail
    const transporter = createTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || undefined;

    const mailOptions = {
      from,
      to: dbEmail,
      subject: 'Mã khôi phục mật khẩu - MyCourseApp',
      text: [
        `Xin chào ${user.username},`,
        '',
        `Mã xác nhận để đặt lại mật khẩu của bạn là: ${code}`,
        '',
        'Mã này có hiệu lực trong 10 phút.',
        '',
        'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.',
      ].join('\n'),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Đã gửi mã tới Gmail của bạn',
    });
  } catch (err) {
    console.error('REQUEST RESET CODE ERROR:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi gửi mã. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
