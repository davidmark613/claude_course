import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getNoteById } from '@/lib/notes';
import NoteEditor from '../NoteEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditNotePage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/authenticate');

  const { id } = await params;
  const note = getNoteById(user.id, id);
  if (!note) notFound();

  return (
    <main className='mx-auto max-w-4xl px-4 py-8'>
      <div className='mb-4'>
        <Link
          href={`/notes/${id}`}
          className='text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        >
          ← Back to note
        </Link>
      </div>
      <NoteEditor note={note} />
    </main>
  );
}
