// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '@/lib/db';


export async function POST(req) {
  try {
    const body = await req.json();
    let { username, password, confirmPassword, email } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Thiếu username hoặc password' },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Mật khẩu xác nhận không khớp' },
        { status: 400 }
      );
    }

    username = username.trim().toLowerCase();
    email = email ? email.trim() : null;

    const db = await getDb();

    // Kiểm tra username trùng
    const existed = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ?',
        [username],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (existed) {
      return NextResponse.json(
        { error: 'Tài khoản đã tồn tại' },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    await new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO users (username, password_hash, role, email, created_at)
        VALUES (?, ?, 'user', ?, datetime('now','localtime'))
      `,
        [username, hash, email],
        (err) => (err ? reject(err) : resolve())
      );
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('SIGNUP ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
