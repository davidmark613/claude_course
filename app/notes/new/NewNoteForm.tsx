'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import EditorToolbar from '@/app/components/EditorToolbar';

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none' +
  ' focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black' +
  ' dark:border-gray-600 dark:bg-gray-800 dark:focus-visible:border-white dark:focus-visible:ring-white';

export default function NewNoteForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    setError(null);
    setLoading(true);

    const contentJson = JSON.stringify(editor.getJSON());

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled note',
          contentJson,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to create note');
        setLoading(false);
        return;
      }

      const { id } = await res.json();
      router.push(`/notes/${id}`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='note-title' className='text-sm font-medium'>
          Title
        </label>
        <input
          id='note-title'
          type='text'
          placeholder='Untitled note'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <span id='note-content-label' className='text-sm font-medium'>
          Content
        </span>
        <div
          aria-labelledby='note-content-label'
          className='min-h-48 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 [&_.tiptap]:outline-none [&_.tiptap]:min-h-40'
        >
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>

      {error && (
        <p role='alert' className='text-sm text-red-600 dark:text-red-400'>
          {error}
        </p>
      )}

      <button
        type='submit'
        disabled={loading || !editor}
        aria-busy={loading}
        className='rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black'
      >
        {loading ? 'Creating…' : 'Create Note'}
      </button>
    </form>
  );
}
