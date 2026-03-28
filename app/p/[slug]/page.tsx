import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getNoteByPublicSlug } from '@/lib/notes';
import NoteRenderer from '@/app/components/NoteRenderer';
import DeleteNoteButton from '@/app/notes/[id]/DeleteNoteButton';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicNotePage({ params }: Props) {
  const { slug } = await params;
  const note = getNoteByPublicSlug(slug);
  if (!note) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === note.userId;

  return (
    <main className='py-12'>
      <div className='mb-6 flex items-start justify-between gap-4'>
        <h1 className='text-3xl font-semibold'>{note.title}</h1>
        {isOwner && (
          <div className='flex shrink-0 items-center gap-2'>
            <Link
              href={`/notes/${note.id}/edit`}
              className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
            >
              Edit
            </Link>
            <DeleteNoteButton noteId={note.id} />
          </div>
        )}
      </div>
      <NoteRenderer contentJson={note.contentJson} />
    </main>
  );
}
