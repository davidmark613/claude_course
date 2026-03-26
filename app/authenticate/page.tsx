import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AuthForm from './auth-form';

export const metadata = {
  title: 'Sign in',
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function AuthenticatePage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  const { mode } = await searchParams;
  const isSignUp = mode === 'signup';

  return (
    <main className='flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-sm'>
        <h1 className='mb-6 text-2xl font-semibold tracking-tight'>
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </h1>
        <AuthForm mode={isSignUp ? 'signup' : 'signin'} />
      </div>
    </main>
  );
}
