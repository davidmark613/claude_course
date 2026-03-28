'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import ThemeToggle from './ThemeToggle';

const HeaderAuth = dynamic(() => import('./HeaderAuth'), { ssr: false });

export default function Header() {
  return (
    <header className='border-b border-gray-200 dark:border-gray-800'>
      <div className='mx-auto flex max-w-4xl items-center justify-between px-4 py-3'>
        <Link
          href='/dashboard'
          className='text-lg font-semibold tracking-tight transition-opacity hover:opacity-75'
        >
          NextNotes
        </Link>
        <div className='flex items-center gap-2'>
          <ThemeToggle />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
