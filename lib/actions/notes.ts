'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createNote, updateNote, deleteNote, setNotePublicSharing } from '@/lib/notes';

const DEFAULT_CONTENT = JSON.stringify({ type: 'doc', content: [] });

const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  contentJson: z.string().optional(),
});

export async function createNoteAction(): Promise<{ id: string }> {
  const session = await getSession();
  if (!session) redirect('/authenticate');

  const note = createNote(session.user.id, 'Untitled note', DEFAULT_CONTENT);
  return { id: note.id };
}

export async function updateNoteAction(
  noteId: string,
  data: { title?: string; contentJson?: string },
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const result = updateNoteSchema.safeParse(data);
  if (!result.success) return { success: false, error: 'Invalid data' };

  const updated = updateNote(session.user.id, noteId, result.data);
  if (!updated) return { success: false, error: 'Note not found' };

  revalidatePath(`/notes/${noteId}`);
  return { success: true };
}

export async function deleteNoteAction(noteId: string): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session) redirect('/authenticate');

  const deleted = deleteNote(session.user.id, noteId);
  if (deleted) revalidatePath('/dashboard');
  return { success: deleted };
}

export async function toggleShareAction(
  noteId: string,
  isPublic: boolean,
): Promise<{ success: boolean; publicSlug?: string | null }> {
  const session = await getSession();
  if (!session) return { success: false };

  const note = setNotePublicSharing(session.user.id, noteId, isPublic);
  if (!note) return { success: false };

  revalidatePath(`/notes/${noteId}`);
  return { success: true, publicSlug: note.publicSlug };
}
