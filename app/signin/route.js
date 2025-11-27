// app/signin/route.js
import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập username và password' },
        { status: 400 }
      );
    }

    const usernameNorm = username.trim().toLowerCase();

    // Tìm user
    const resUser = await dbQuery(
      `SELECT id, username, password_hash, role, full_name, email, created_at
       FROM users
       WHERE username = $1`,
      [usernameNorm]
    );

    if (resUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sai username hoặc password' },
        { status: 401 }
      );
    }

    const user = resUser.rows[0];

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: 'Sai username hoặc password' },
        { status: 401 }
      );
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const { password_hash, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('SIGNIN ERROR:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi đăng nhập' },
      { status: 500 }
    );
  }
}
