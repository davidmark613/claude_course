'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none' +
  ' focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black' +
  ' dark:border-gray-600 dark:bg-gray-800 dark:focus-visible:border-white dark:focus-visible:ring-white';

export default function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'signup';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      await authClient.signUp.email(
        { name: email, email, password },
        {
          onSuccess: () => {
            router.push('/dashboard');
          },
          onError: (ctx) => setError(ctx.error.message),
        },
      );
    } else {
      await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => {
            router.push('/dashboard');
          },
          onError: (ctx) => setError(ctx.error.message),
        },
      );
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='email' className='text-sm font-medium'>
          Email
        </label>
        <input
          id='email'
          type='email'
          autoComplete='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='password' className='text-sm font-medium'>
          Password
        </label>
        <input
          id='password'
          type='password'
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p role='alert' className='text-sm text-red-600 dark:text-red-400'>
          {error}
        </p>
      )}

      <button
        type='submit'
        disabled={loading}
        aria-busy={loading}
        className='rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black'
      >
        {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
      </button>

      <p className='text-center text-sm text-gray-600 dark:text-gray-400'>
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <Link href='?mode=signin' className='font-medium underline underline-offset-2'>
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account yet?{' '}
            <Link href='?mode=signup' className='font-medium underline underline-offset-2'>
              Create one
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
