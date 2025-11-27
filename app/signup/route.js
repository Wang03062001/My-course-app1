import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ username và password' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = await db.get(
      'SELECT id FROM users WHERE username = ?',
      username
    );
    if (existing) {
      return NextResponse.json(
        { error: 'Username đã tồn tại' },
        { status: 400 }
      );
    }

    const password_hash = await hashPassword(password);
    const result = await db.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      username,
      password_hash,
      'user'
    );

    const user = {
      id: result.lastID,
      username,
      role: 'user',
    };

    const token = signToken(user);

    return NextResponse.json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi đăng ký' },
      { status: 500 }
    );
  }
}
