import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Login Panitia',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />}>
      <LoginForm />
    </Suspense>
  );
}
