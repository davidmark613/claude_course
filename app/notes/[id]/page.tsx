import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getNoteById } from '@/lib/notes';
import NoteRenderer from '@/app/components/NoteRenderer';
import DeleteNoteButton from './DeleteNoteButton';
import ShareToggle from './ShareToggle';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/authenticate');

  const { id } = await params;
  const note = getNoteById(user.id, id);
  if (!note) notFound();

  return (
    <main className='mx-auto max-w-4xl px-4 py-8'>
      <div className='mb-4'>
        <Link
          href='/dashboard'
          className='text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        >
          ← My Notes
        </Link>
      </div>
      <div className='mb-6 flex items-center justify-between gap-4'>
        <h1 className='text-2xl font-semibold truncate'>{note.title}</h1>
        <div className='flex shrink-0 items-center gap-2'>
          <Link
            href={`/notes/${id}/edit`}
            className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
          >
            Edit
          </Link>
          <DeleteNoteButton noteId={id} />
        </div>
      </div>

      <NoteRenderer contentJson={note.contentJson} />
      <ShareToggle noteId={id} initialIsPublic={note.isPublic} initialSlug={note.publicSlug} />
    </main>
  );
}
