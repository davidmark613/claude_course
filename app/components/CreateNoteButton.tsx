'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createNoteAction } from '@/lib/actions/notes';

export default function CreateNoteButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await createNoteAction();
        router.push(`/notes/${id}/edit`);
      } catch {
        setError('Failed to create note');
      }
    });
  }

  return (
    <div className='flex flex-col items-end gap-1'>
      <button
        type='button'
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
        className='rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black'
      >
        {isPending ? 'Creating…' : 'New Note'}
      </button>
      {error && <p className='text-xs text-red-600 dark:text-red-400'>{error}</p>}
    </div>
  );
}
