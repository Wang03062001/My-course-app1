'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import useAuth from '../../../hooks/useAuth';

function getUserKey(user) {
  const id = user?.id || user?.uid || user?.email;
  return id ? String(id) : null;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id ? String(params.id) : '';

  const { user, loading } = useAuth();

  const userKey = useMemo(() => getUserKey(user), [user]);
  const storageKey = useMemo(() => {
    if (!userKey) return null;
    return `mycourseapp:courses:lessons:${userKey}`;
  }, [userKey]);

  const [item, setItem] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // ===== Modal state (Edit title) =====
  const [open, setOpen] = useState(false);
  const [title1, setTitle1] = useState('');
  const [title2, setTitle2] = useState('');
  const [error, setError] = useState('');

  // Portal safe mount (avoid hydration mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (loading) return;

    if (!storageKey) {
      setItem(null);
      setNotFound(true);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const found = list.find((x) => String(x.id) === courseId);

      if (!found) {
        setItem(null);
        setNotFound(true);
      } else {
        setItem(found);
        setNotFound(false);
      }
    } catch {
      setItem(null);
      setNotFound(true);
    }
  }, [loading, storageKey, courseId]);

  const closeModal = () => {
    setOpen(false);
    setError('');
  };

  const openEditModal = () => {
    setError('');
    if (!userKey || !storageKey) {
      setError('Bạn cần đăng nhập để sửa bài học.');
      return;
    }
    setTitle1(item?.title1 ?? '');
    setTitle2(item?.title2 ?? '');
    setOpen(true);
  };

  const onSubmit = () => {
    setError('');
    if (!userKey || !storageKey) {
      setError('Bạn cần đăng nhập để thực hiện thao tác.');
      return;
    }

    const t1 = (title1 || '').trim();
    const t2 = (title2 || '').trim();
    if (!t1.length || !t2.length) {
      setError('Vui lòng nhập đầy đủ Tiêu đề 1 và Tiêu đề 2.');
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];

      const next = list.map((it) =>
        String(it.id) === courseId
          ? { ...it, title1: t1, title2: t2, updatedAt: new Date().toISOString() }
          : it
      );

      localStorage.setItem(storageKey, JSON.stringify(next));

      const updated = next.find((x) => String(x.id) === courseId) || null;
      setItem(updated);
      setOpen(false);
    } catch {
      setError('Không thể lưu dữ liệu. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="admin-card">
        <h2 className="admin-card-title">Đang tải...</h2>
        <p className="admin-card-text">Vui lòng chờ.</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="admin-card">
        <h2 className="admin-card-title">Không tìm thấy bài học</h2>
        <p className="admin-card-text">
          Bài học không tồn tại, hoặc bạn chưa đăng nhập đúng tài khoản đã tạo bài học.
        </p>

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
          <button className="btn-outline btn-sm" onClick={() => router.push('/courses')}>
            Quay lại Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title" style={{ margin: 0 }}>
              {item?.title1}
            </h2>
            <p className="admin-card-text" style={{ margin: '0.35rem 0 0' }}>
              {item?.title2}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {!!userKey && (
              <button className="btn-outline btn-sm" onClick={openEditModal}>
                Sửa
              </button>
            )}

            <button className="btn-outline btn-sm" onClick={() => router.push('/courses')}>
              Quay lại
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          {item?.createdAt && (
            <p className="admin-card-text" style={{ margin: '0.35rem 0 0', color: 'var(--text-subtle)' }}>
              Tạo lúc:{' '}
              <span style={{ color: 'var(--text-main)' }}>
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </p>
          )}

          {item?.updatedAt && (
            <p className="admin-card-text" style={{ margin: '0.35rem 0 0', color: 'var(--text-subtle)' }}>
              Cập nhật:{' '}
              <span style={{ color: 'var(--text-main)' }}>
                {new Date(item.updatedAt).toLocaleString()}
              </span>
            </p>
          )}
        </div>

        <div style={{ marginTop: '1.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Nội dung</h3>
          <p className="admin-card-text" style={{ marginTop: '0.35rem' }}>
            (Placeholder) Bạn có thể mở rộng phần này để nhập nội dung bài học, section, tài liệu, v.v.
          </p>
        </div>
      </div>

      {/* ===== Modal via Portal: always full-page overlay ===== */}
      {mounted && open
        ? createPortal(
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <div className="modal-box course-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">Sửa tiêu đề</h3>
                <p className="modal-text">Cập nhật 2 tiêu đề rồi bấm Lưu.</p>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div className="auth-field-small" style={{ marginBottom: 0 }}>
                    <label className="auth-label-small">Tiêu đề 1</label>
                    <input
                      className="auth-input-small"
                      value={title1}
                      onChange={(e) => setTitle1(e.target.value)}
                      placeholder="Nhập tiêu đề 1"
                      autoFocus
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
                    Lưu
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
