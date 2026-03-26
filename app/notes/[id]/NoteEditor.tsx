'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (data: Partial<{ title: string; contentJson: string }>) => {
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/notes/${note.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        setSaveStatus(res.ok ? 'saved' : 'error');
      } catch {
        setSaveStatus('error');
      }
    },
    [note.id],
  );

  const scheduleSave = useCallback(
    (data: Partial<{ title: string; contentJson: string }>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(data), 1000);
    },
    [save],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: JSON.parse(note.contentJson),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      scheduleSave({ contentJson: JSON.stringify(editor.getJSON()) });
    },
  });

  // Save title on change (debounced)
  useEffect(() => {
    if (title === note.title) return;
    scheduleSave({ title });
  }, [title, note.title, scheduleSave]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-4'>
        <input
          type='text'
          aria-label='Note title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
        <span className='shrink-0 text-xs text-gray-400 dark:text-gray-500'>
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </span>
      </div>

      <div className='rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 [&_.tiptap]:outline-none [&_.tiptap]:min-h-64'>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
