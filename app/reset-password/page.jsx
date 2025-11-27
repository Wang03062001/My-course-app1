// app/reset-password/page.jsx
import { Suspense } from 'react';
import ResetPasswordContent from './ResetPasswordContent';

export const metadata = {
  title: 'Đặt lại mật khẩu',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
