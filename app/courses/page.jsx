'use client';

import { useEffect, useMemo, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

function getUserKey(user) {
  const id = user?.id || user?.uid || user?.email;
  return id ? String(id) : null;
}

export default function CoursesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const userKey = useMemo(() => getUserKey(user), [user]);
  const storageKey = useMemo(() => {
    if (!userKey) return null;
    return `mycourseapp:courses:lessons:${userKey}`;
  }, [userKey]);

  const [items, setItems] = useState([]);

  // modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title1, setTitle1] = useState('Tiêu đề 1');
  const [title2, setTitle2] = useState('Tiêu đề 2');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!storageKey) {
      setItems([]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, [loading, storageKey]);

  const persist = (next) => {
    setItems(next);
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const addLabel =
    items.length === 0 ? 'Chưa có bài học. Hãy thêm bài học của bạn' : 'Thêm bài học';

  const openCreateModal = () => {
    setError('');
    if (!userKey) {
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
    if (!userKey) {
      setError('Bạn cần đăng nhập để sửa bài học.');
      return;
    }
    setEditingId(item.id);
    setTitle1(item.title1 ?? '');
    setTitle2(item.title2 ?? '');
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setError('');
  };

  const onSubmit = () => {
    if (!userKey) {
      setError('Bạn cần đăng nhập để thực hiện thao tác.');
      return;
    }

    const t1 = (title1 || '').trim();
    const t2 = (title2 || '').trim();

    if (!t1.length || !t2.length) {
      setError('Vui lòng nhập đầy đủ Tiêu đề 1 và Tiêu đề 2.');
      return;
    }

    if (!editingId) {
      const newItem = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        title1: t1,
        title2: t2,
        createdAt: new Date().toISOString(),

        // ✅ cấu trúc mở rộng để trang /lessons/[id] dùng được về sau
        content: '',
        sections: [],
        updatedAt: null,
      };
      persist([newItem, ...items]);
      setOpen(false);
      return;
    }

    const next = items.map((it) =>
      it.id === editingId
        ? { ...it, title1: t1, title2: t2, updatedAt: new Date().toISOString() }
        : it
    );
    persist(next);
    setOpen(false);
  };

  const onDelete = (id) => {
    if (!userKey) {
      setError('Bạn cần đăng nhập để xóa bài học.');
      return;
    }
    const ok = window.confirm('Bạn có chắc muốn xóa bài học này không?');
    if (!ok) return;

    const next = items.filter((it) => it.id !== id);
    persist(next);
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

      <div className="courses-grid">
        {/* Các ô đã tạo: click để mở /lessons/[id] */}
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
    <div className="modal-box course-modal" onClick={(e) => e.stopPropagation()}>
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
          />
        </div>

        <div className="auth-field-small" style={{ marginBottom: 0 }}>
          <label className="auth-label-small">Tiêu đề 2</label>
          <input
            className="auth-input-small"
            value={title2}
            onChange={(e) => setTitle2(e.target.value)}
            placeholder="Nhập tiêu đề 2"
          />
        </div>
      </div>

      {error && (
        <div className="auth-message-small" style={{ marginTop: '0.75rem' }}>
          {error}
        </div>
      )}

      <div className="modal-actions" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn-outline btn-sm" onClick={closeModal}>
          Huỷ
        </button>
        <button type="button" className="btn-primary btn-sm course-create-btn" onClick={onSubmit}>
          {editingId ? 'Lưu' : 'Tạo'}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
