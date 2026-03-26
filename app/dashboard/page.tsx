import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getNotesByUser } from '@/lib/notes';
import CreateNoteButton from '@/app/components/CreateNoteButton';

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/authenticate');

  const notes = getNotesByUser(user.id);

  return (
    <main className='mx-auto max-w-4xl px-4 py-8'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-semibold'>My Notes</h1>
        <CreateNoteButton />
      </div>

      {notes.length === 0 ? (
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          No notes yet. Create one to get started.
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className='flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
              >
                <span className='font-medium'>{note.title}</span>
                <span className='flex items-center gap-3'>
                  {note.isPublic && (
                    <span className='rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400'>
                      Shared
                    </span>
                  )}
                  <span className='text-xs text-gray-400 dark:text-gray-500'>
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
