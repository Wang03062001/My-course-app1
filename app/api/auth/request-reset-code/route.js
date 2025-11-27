// app/api/auth/request-reset-code/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { getDb } from '../../../../lib/db';

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
    secure: port === 465, // 465 dùng SSL, 587 dùng STARTTLS
    auth: { user, pass },
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

    // Đảm bảo có bảng password_reset_codes
    await new Promise((resolve, reject) => {
      db.run(
        `CREATE TABLE IF NOT EXISTS password_reset_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          code TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )`,
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Tìm user theo username
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email FROM users WHERE LOWER(username) = ?',
        [username],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    // Kiểm tra Gmail có trùng với DB không
    const dbEmail = (user.email || '').trim().toLowerCase();
    if (!dbEmail || dbEmail !== email) {
      return NextResponse.json(
        { error: 'Gmail không trùng khớp với user này' },
        { status: 400 }
      );
    }

    // Xoá các mã cũ của user (nếu có)
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM password_reset_codes WHERE user_id = ?',
        [user.id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Tạo mã 6 số, hiệu lực 10 phút
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 phút

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO password_reset_codes (user_id, code, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
        [user.id, code, expiresAt, now],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Gửi mail
    const transporter = createTransporter();

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
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
        'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.'
      ].join('\n'),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Đã gửi mã tới Gmail của bạn' });
  } catch (err) {
    console.error('REQUEST RESET CODE ERROR:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi gửi mã. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
