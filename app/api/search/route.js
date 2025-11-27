// app/api/search/route.js
import { NextResponse } from "next/server";
import { getDb } from '@/lib/db';

// GET /api/search?q=tu-khoa
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

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
    const users = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT id, username, email, role, created_at
        FROM users
        WHERE username LIKE ?
           OR (email IS NOT NULL AND email LIKE ?)
           OR role LIKE ?
        ORDER BY username ASC
        LIMIT 20
        `,
        [like, like, like],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    // ===== TÌM COURSE (SOURSE) THEO title / name / code =====
    const courses = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT id, title, name, code
        FROM courses
        WHERE (title IS NOT NULL AND title LIKE ?)
           OR (name IS NOT NULL AND name LIKE ?)
           OR (code IS NOT NULL AND code LIKE ?)
        ORDER BY title ASC
        LIMIT 20
        `,
        [like, like, like],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    }).catch(() => []); // nếu chưa có bảng courses thì không bị crash

    // ===== TÌM LESSON THEO title =====
    const lessons = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT id, title, course_id
        FROM lessons
        WHERE title LIKE ?
        ORDER BY title ASC
        LIMIT 20
        `,
        [like],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    }).catch(() => []); // nếu chưa có bảng lessons thì không bị crash

    return NextResponse.json({
      users,
      courses,
      lessons,
    });
  } catch (err) {
    console.error("SEARCH API ERROR:", err);
    return NextResponse.json(
      { error: "Lỗi server khi tìm kiếm" },
      { status: 500 }
    );
  }
}
