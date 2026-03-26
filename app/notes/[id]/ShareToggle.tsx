'use client';

import { useState } from 'react';

interface Props {
  noteId: string;
  initialIsPublic: boolean;
  initialSlug: string | null;
}

export default function ShareToggle({ noteId, initialIsPublic, initialSlug }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = slug ? `${window.location.origin}/p/${slug}` : null;

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: !isPublic }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsPublic(data.isPublic);
        setSlug(data.publicSlug);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className='mt-8 border-t border-gray-200 pt-6 dark:border-gray-700'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>Public Sharing</p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {isPublic ? 'Anyone with the link can view this note' : 'Only you can view this note'}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          role='switch'
          aria-checked={isPublic}
          aria-label='Toggle public sharing'
          onClick={toggle}
          disabled={loading}
          className={[
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white',
            'disabled:opacity-50',
            isPublic ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 dark:bg-black',
              isPublic ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>

      {isPublic && publicUrl && (
        <div className='mt-3 flex items-center gap-2'>
          <input
            readOnly
            value={publicUrl}
            className='flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
          />
          <button
            onClick={copyUrl}
            className='shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
