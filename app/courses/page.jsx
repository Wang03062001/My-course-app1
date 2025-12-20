'use client';

import { useEffect, useMemo, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

// ✅ ĐỔI PATH NÀY cho đúng dự án của bạn nếu khác
import { supabase } from '../../lib/supabaseClient';

function toCourse(row) {
  if (!row) return null;
  return {
    id: row.id,
    title1: row.title1 ?? '',
    title2: row.title2 ?? '',
    content: row.content ?? '',
    sections: Array.isArray(row.sections) ? row.sections : (row.sections ?? []),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export default function CoursesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const isLoggedIn = useMemo(() => !!user, [user]);

  const [items, setItems] = useState([]);

  // modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title1, setTitle1] = useState('Tiêu đề 1');
  const [title2, setTitle2] = useState('Tiêu đề 2');

  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Load data từ Supabase theo user (RLS sẽ tự lọc theo auth.uid())
  useEffect(() => {
    if (loading) return;

    if (!isLoggedIn) {
      setItems([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setError('');
      setPageLoading(true);

      try {
        const { data, error: dbErr } = await supabase
          .from('courses')
          .select('id,title1,title2,content,sections,created_at,updated_at')
          .order('created_at', { ascending: false });

        if (dbErr) throw dbErr;
        if (cancelled) return;

        const list = Array.isArray(data) ? data.map(toCourse) : [];
        setItems(list);
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setError(e?.message || 'Không thể tải danh sách bài học từ Supabase.');
        }
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [loading, isLoggedIn]);

  const addLabel =
    items.length === 0 ? 'Chưa có bài học. Hãy thêm bài học của bạn' : 'Thêm bài học';

  const openCreateModal = () => {
    setError('');
    if (!isLoggedIn) {
      setError('Bạn cần đăng nhập để tạo bài học.');
      return;
    }
    setEditingId(null);
    setTitle1('Tiêu đề 1');
    setTitle2('Tiêu đề 2');
    setOpen(true);
  };

  const openEditModal = (item) => {
    setError('');
    if (!isLoggedIn) {
      setError('Bạn cần đăng nhập để sửa bài học.');
      return;
    }
    setEditingId(item.id);
    setTitle1(item.title1 ?? '');
    setTitle2(item.title2 ?? '');
    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return; // tránh đóng khi đang lưu
    setOpen(false);
    setEditingId(null);
    setError('');
  };

  const onSubmit = async () => {
    if (!isLoggedIn) {
      setError('Bạn cần đăng nhập để thực hiện thao tác.');
      return;
    }

    const t1 = (title1 || '').trim();
    const t2 = (title2 || '').trim();

    if (!t1.length || !t2.length) {
      setError('Vui lòng nhập đầy đủ Tiêu đề 1 và Tiêu đề 2.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // CREATE
      if (!editingId) {
        const payload = {
          title1: t1,
          title2: t2,
          content: '',
          sections: [],
          // user_id: không cần nếu DB để default auth.uid() + RLS
        };

        const { data, error: dbErr } = await supabase
          .from('courses')
          .insert(payload)
          .select('id,title1,title2,content,sections,created_at,updated_at')
          .single();

        if (dbErr) throw dbErr;

        const created = toCourse(data);
        setItems((prev) => [created, ...prev]);
        setOpen(false);
        setEditingId(null);
        return;
      }

      // UPDATE
      const { data, error: dbErr } = await supabase
        .from('courses')
        .update({
          title1: t1,
          title2: t2,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)
        .select('id,title1,title2,content,sections,created_at,updated_at')
        .single();

      if (dbErr) throw dbErr;

      const updated = toCourse(data);
      setItems((prev) => prev.map((it) => (it.id === editingId ? updated : it)));
      setOpen(false);
      setEditingId(null);
    } catch (e) {
      setError(e?.message || 'Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!isLoggedIn) {
      setError('Bạn cần đăng nhập để xóa bài học.');
      return;
    }

    const ok = window.confirm('Bạn có chắc muốn xóa bài học này không?');
    if (!ok) return;

    setError('');
    try {
      const { error: dbErr } = await supabase.from('courses').delete().eq('id', id);
      if (dbErr) throw dbErr;

      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      setError(e?.message || 'Xóa thất bại. Vui lòng thử lại.');
    }
  };

  const goDetail = (id) => {
    router.push(`/courses/${id}`);
  };

  return (
    <div className="courses-page">
      <div className="admin-card-header" style={{ marginBottom: '0.9rem' }}>
        <div>
          <h2 className="admin-card-title" style={{ margin: 0 }}>Courses</h2>
          <p
            className="admin-card-text"
            style={{ margin: '0.35rem 0 0', color: 'var(--text-subtle)' }}
          >
            Click vào ô để xem chi tiết bài học.
          </p>
        </div>
      </div>

      {error && (
        <div className="auth-message-small" style={{ marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {pageLoading && (
        <div className="admin-card" style={{ marginBottom: '0.9rem' }}>
          <p className="admin-card-text" style={{ margin: 0 }}>
            Đang tải dữ liệu...
          </p>
        </div>
      )}

      <div className="courses-grid">
        {/* Các ô đã tạo: click để mở /courses/[id] */}
        {items.map((it) => (
          <div
            key={it.id}
            className="glass-card admin-card course-item-card course-clickable"
            role="button"
            tabIndex={0}
            onClick={() => goDetail(it.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goDetail(it.id);
              }
            }}
            title="Xem chi tiết"
          >
            <div className="course-item-top">
              <h3 className="course-item-title">{it.title1}</h3>

              <div className="course-item-actions">
                <button
                  type="button"
                  className="course-action-btn course-action-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(it);
                  }}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="course-action-btn course-action-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(it.id);
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>

            <p className="course-item-subtitle">{it.title2}</p>
          </div>
        ))}

        {/* Ô add */}
        <button
          type="button"
          className={`glass-card admin-card course-add-card ${items.length === 0 ? 'is-empty' : ''}`}
          onClick={openCreateModal}
          aria-label={addLabel}
        >
          <span className="course-add-text">{addLabel}</span>
          <span className="course-add-plus" aria-hidden="true">+</span>
        </button>
      </div>

      {/* Popup Create/Edit */}
      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-box course-modal">
            <h3 className="modal-title">{editingId ? 'Sửa bài học' : 'Tạo bài học'}</h3>
            <p className="modal-text">
              {editingId ? 'Cập nhật 2 tiêu đề rồi bấm Lưu.' : 'Bạn có thể chỉnh sửa 2 tiêu đề trước khi tạo.'}
            </p>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div className="auth-field-small" style={{ marginBottom: 0 }}>
                <label className="auth-label-small">Tiêu đề 1</label>
                <input
                  className="auth-input-small"
                  value={title1}
                  onChange={(e) => setTitle1(e.target.value)}
                  placeholder="Nhập tiêu đề 1"
                  disabled={saving}
                />
              </div>

              <div className="auth-field-small" style={{ marginBottom: 0 }}>
                <label className="auth-label-small">Tiêu đề 2</label>
                <input
                  className="auth-input-small"
                  value={title2}
                  onChange={(e) => setTitle2(e.target.value)}
                  placeholder="Nhập tiêu đề 2"
                  disabled={saving}
                />
              </div>
            </div>

            {error && (
              <div className="auth-message-small" style={{ marginTop: '0.75rem' }}>
                {error}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn-outline btn-sm" onClick={closeModal} disabled={saving}>
                Huỷ
              </button>
              <button
                type="button"
                className="btn-primary btn-sm course-create-btn"
                onClick={onSubmit}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : (editingId ? 'Lưu' : 'Tạo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
