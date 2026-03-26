import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import NewNoteForm from './NewNoteForm';

export default async function NewNotePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/authenticate');

  return (
    <main className='mx-auto max-w-4xl px-4 py-8'>
      <h1 className='text-2xl font-semibold mb-6'>New Note</h1>
      <NewNoteForm />
    </main>
  );
}
