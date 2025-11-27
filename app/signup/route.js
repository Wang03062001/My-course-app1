// app/signup/route.js
import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, full_name, email } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ username và password' },
        { status: 400 }
      );
    }

    const usernameNorm = username.trim().toLowerCase();
    const emailNorm = email ? email.trim().toLowerCase() : null;

    // Kiểm tra username đã tồn tại chưa
    const existing = await dbQuery(
      'SELECT id FROM users WHERE username = $1',
      [usernameNorm]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username đã tồn tại' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Tạo user mới
    const insertRes = await dbQuery(
      `INSERT INTO users (username, password_hash, role, full_name, email)
       VALUES ($1, $2, 'user', $3, $4)
       RETURNING id, username, role, full_name, email, created_at`,
      [usernameNorm, passwordHash, full_name || null, emailNorm]
    );

    const user = insertRes.rows[0];

    // Tạo token (tự login luôn sau khi signup)
    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error('SIGNUP ERROR:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi đăng ký' },
      { status: 500 }
    );
  }
}
