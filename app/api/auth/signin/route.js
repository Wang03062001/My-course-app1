// app/api/auth/signin/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';


const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRES = 60 * 60 * 24 * 7; // 7 ngày

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Thiếu username hoặc password' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const user = await new Promise((resolve, reject) => {
      db.get(
        // lấy luôn full_name nếu có
        'SELECT id, username, password_hash, role, email, created_at, full_name FROM users WHERE username = ?',
        [username.trim().toLowerCase()],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Sai username hoặc password' },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Sai username hoặc password' },
        { status: 400 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES }
    );

    // 🔴 TRẢ VỀ TOKEN CHO useAuth
    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
      },
    });

    // Cookie JWT (tuỳ bạn có dùng hay không, cứ giữ)
    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRES,
    });

    return res;
  } catch (err) {
    console.error('SIGNIN ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
