'use client';
import { AppProvider } from '@/context/AppContext';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AppProvider>
      <LoginForm />
    </AppProvider>
  );
}
