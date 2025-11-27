// app/api/auth/send-reset-code/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import nodemailer from 'nodemailer';

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Chưa cấu hình GMAIL_USER / GMAIL_PASS trong .env.local');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, email } = body || {};

    if (!username || !email) {
      return NextResponse.json(
        { error: 'Thiếu username hoặc gmail' },
        { status: 400 }
      );
    }

    const db = await getDb();

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

    // Kiểm tra email trùng khớp
    if (!user.email || user.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'Gmail không trùng khớp với user' },
        { status: 400 }
      );
    }

    // Tạo mã 6 chữ số
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút

    // Xoá mã cũ của user này (nếu có)
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM password_resets WHERE user_id = ?',
        [user.id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Lưu mã mới
    await new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO password_resets (user_id, code, expires_at)
        VALUES (?, ?, ?)
      `,
        [user.id, code, expiresAt],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Gửi email
    const transporter = createTransporter();
    const from = process.env.GMAIL_FROM || process.env.GMAIL_USER;

    await transporter.sendMail({
      from,
      to: user.email,
      subject: 'Mã xác nhận đổi mật khẩu',
      text: `Mã xác nhận của bạn là: ${code} (hiệu lực 10 phút).`,
      html: `<p>Mã xác nhận của bạn là: <b>${code}</b></p><p>Mã có hiệu lực trong 10 phút.</p>`,
    });

    return NextResponse.json({ success: true, message: 'Đã gửi mã' });
  } catch (err) {
    console.error('SEND RESET CODE ERROR:', err);
    return NextResponse.json(
      { error: 'Lỗi kết nối server khi gửi mã' },
      { status: 500 }
    );
  }
}
