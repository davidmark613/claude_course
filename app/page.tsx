import Link from 'next/link';

export default function Home() {
  return (
    <main className='py-24 text-center'>
      <h1 className='mb-4 text-4xl font-semibold tracking-tight'>Your notes, beautifully simple</h1>
      <p className='mb-8 text-gray-500 dark:text-gray-400'>
        Write, organize, and share rich-text notes — all in one place.
      </p>
      <div className='flex justify-center gap-3'>
        <Link
          href='/authenticate?mode=signup'
          className='rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black'
        >
          Get started
        </Link>
        <Link
          href='/authenticate'
          className='rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
