'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteNoteButton({ noteId }: { noteId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleConfirm() {
    startTransition(async () => {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      router.push('/dashboard');
    });
  }

  return (
    <>
      <button
        onClick={openDialog}
        className='rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950'
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className='m-auto w-full max-w-sm rounded-lg border border-gray-200 p-6 shadow-lg backdrop:bg-black/40 dark:border-gray-700 dark:bg-gray-900'
      >
        <h2 className='mb-2 text-base font-semibold dark:text-white'>Delete note?</h2>
        <p className='mb-6 text-sm text-gray-500 dark:text-gray-400'>
          Are you sure you want to delete this note? This action cannot be undone.
        </p>
        <div className='flex justify-end gap-3'>
          <button
            onClick={closeDialog}
            disabled={isPending}
            className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className='rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50'
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </dialog>
    </>
  );
}
