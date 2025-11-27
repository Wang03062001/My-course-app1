import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username } = body || {};

    if (!username) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập (email).' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Tìm user theo username
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username FROM users WHERE username = ?',
        [username],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    // Không để lộ là user có tồn tại hay không
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Nếu tài khoản tồn tại, link đặt lại mật khẩu đã được gửi vào email.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 15; // 15 phút

    // Lưu token vào bảng password_resets
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt],
        (err) => (err ? reject(err) : resolve())
      );
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Gửi mail qua Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Gmail của bạn
        pass: process.env.GMAIL_PASS, // App password
      },
    });

    await transporter.sendMail({
      from: `"Course App" <${process.env.GMAIL_USER}>`,
      to: user.username, // Giả định username = địa chỉ email
      subject: 'Đặt lại mật khẩu',
      text: `Bạn đã yêu cầu đặt lại mật khẩu.\n\nNhấn vào link sau để đặt mật khẩu mới:\n${resetUrl}\n\nLink có hiệu lực trong 15 phút.`,
      html: `
        <p>Xin chào <b>${user.username}</b>,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
        <p>Nhấn vào nút bên dưới để đặt mật khẩu mới (link có hiệu lực trong 15 phút):</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Nếu tài khoản tồn tại, link đặt lại mật khẩu đã được gửi vào email.',
    });
  } catch (err) {
    console.error('REQUEST RESET ERROR:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi gửi email reset.' },
      { status: 500 }
    );
  }
}
