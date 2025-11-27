// app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

function getAdminFromReq(req) {
  const auth = req.headers.get('authorization') || '';
  let token = null;

  if (auth.toLowerCase().startsWith('bearer ')) {
    token = auth.slice(7).trim();
  }
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') return null;
  return decoded;
}

// PUT /api/admin/users/[id]
export async function PUT(req, { params }) {
  try {
    const admin = getAdminFromReq(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Không có quyền' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id, 10);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID user không hợp lệ' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { full_name, email, role, newPassword } = body || {};

    const currentRes = await dbQuery(
      `SELECT id, username, role FROM users WHERE id = $1`,
      [userId]
    );
    if (currentRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    const updates = [];
    const paramsArr = [];
    let i = 1;

    if (typeof full_name === 'string') {
      updates.push(`full_name = $${i++}`);
      paramsArr.push(full_name.trim());
    }

    if (typeof email === 'string') {
      updates.push(`email = $${i++}`);
      paramsArr.push(email.trim().toLowerCase());
    }

    if (typeof role === 'string') {
      updates.push(`role = $${i++}`);
      paramsArr.push(role.trim());
    }

    if (typeof newPassword === 'string' && newPassword.trim()) {
      const hash = await hashPassword(newPassword.trim());
      updates.push(`password_hash = $${i++}`);
      paramsArr.push(hash);
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có gì để cập nhật',
      });
    }

    paramsArr.push(userId);

    await dbQuery(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${i}`,
      paramsArr
    );

    const updatedRes = await dbQuery(
      `SELECT id, username, role, full_name, email, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      user: updatedRes.rows[0],
    });
  } catch (err) {
    console.error('UPDATE USER ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(req, { params }) {
  try {
    const admin = getAdminFromReq(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Không có quyền' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id, 10);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID user không hợp lệ' },
        { status: 400 }
      );
    }

    const currentRes = await dbQuery(
      `SELECT id, role FROM users WHERE id = $1`,
      [userId]
    );
    if (currentRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'User không tồn tại' },
        { status: 404 }
      );
    }

    const current = currentRes.rows[0];

    if (current.role === 'admin') {
      const countRes = await dbQuery(
        `SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'`
      );
      const count = Number(countRes.rows[0].cnt || 0);
      if (count <= 1) {
        return NextResponse.json(
          {
            error:
              'Không thể xoá admin cuối cùng. Hệ thống phải có ít nhất 1 admin.',
          },
          { status: 400 }
        );
      }
    }

    await dbQuery(
      `DELETE FROM users WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE USER ERROR:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
