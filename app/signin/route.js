import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

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
    const userRow = await db.get(
      'SELECT id, username, password_hash, role FROM users WHERE username = ?',
      username
    );

    if (!userRow) {
      return NextResponse.json(
        { error: 'Tài khoản không tồn tại' },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password, userRow.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Sai mật khẩu' },
        { status: 400 }
      );
    }

    const user = {
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
    };

    const token = signToken(user);

    return NextResponse.json({ user, token });
  } catch (err) {
    console.error('Signin error:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi đăng nhập' },
      { status: 500 }
    );
  }
}
