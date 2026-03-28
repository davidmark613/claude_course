'use client';

import { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import EditorToolbar from '@/app/components/EditorToolbar';
import type { Note } from '@/lib/notes';

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none' +
  ' focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black' +
  ' dark:border-gray-600 dark:bg-gray-800 dark:focus-visible:border-white dark:focus-visible:ring-white';

export default function NoteEditor({ note }: { note: Note }) {
  const [title, setTitle] = useState(note.title);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (data: Partial<{ title: string; contentJson: string }>) => {
      setSaving(true);
      try {
        await fetch(`/api/notes/${note.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } finally {
        setSaving(false);
      }
    },
    [note.id],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: JSON.parse(note.contentJson),
    immediatelyRender: false,
  });

  const handleSubmit = useCallback(async () => {
    await save({
      title,
      contentJson: editor ? JSON.stringify(editor.getJSON()) : undefined,
    });
  }, [save, title, editor]);

  return (
    <div className='flex flex-col gap-4'>
      <input
        type='text'
        aria-label='Note title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputClass}
      />

      <div className='rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 [&_.tiptap]:outline-none [&_.tiptap]:min-h-64'>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className='self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black'
      >
        Save changes
      </button>
    </div>
  );
}
