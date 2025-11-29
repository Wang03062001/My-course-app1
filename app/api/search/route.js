// app/api/search/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/search?q=tu-khoa
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({
        users: [],
        courses: [],
        lessons: [],
      });
    }

    const like = `%${q}%`;
    const db = await getDb();

    // ===== TÌM USER THEO username + email + role =====
    const usersRes = await db.query(
      `
      SELECT id, username, email, role, created_at
      FROM users
      WHERE username ILIKE $1
         OR (email IS NOT NULL AND email ILIKE $1)
         OR role ILIKE $1
      ORDER BY username ASC
      LIMIT 20
      `,
      [like]
    );
    const users = usersRes.rows;

    // ===== TÌM COURSE THEO title / name / code =====
    let courses = [];
    try {
      const coursesRes = await db.query(
        `
        SELECT id, title, name, code
        FROM courses
        WHERE (title IS NOT NULL AND title ILIKE $1)
           OR (name IS NOT NULL AND name ILIKE $1)
           OR (code IS NOT NULL AND code ILIKE $1)
        ORDER BY title ASC
        LIMIT 20
        `,
        [like]
      );
      courses = coursesRes.rows;
    } catch (e) {
      // console.warn('SEARCH: lỗi query courses (có thể chưa tạo bảng):', e.message);
      courses = [];
    }

    // ===== TÌM LESSON THEO title =====
    let lessons = [];
    try {
      const lessonsRes = await db.query(
        `
        SELECT id, title, course_id
        FROM lessons
        WHERE title ILIKE $1
        ORDER BY title ASC
        LIMIT 20
        `,
        [like]
      );
      lessons = lessonsRes.rows;
    } catch (e) {
      // console.warn('SEARCH: lỗi query lessons (có thể chưa tạo bảng):', e.message);
      lessons = [];
    }

    return NextResponse.json({
      users,
      courses,
      lessons,
    });
  } catch (err) {
    console.error('SEARCH API ERROR:', err);
    return NextResponse.json(
      { error: 'Lỗi server khi tìm kiếm' },
      { status: 500 }
    );
  }
}
