import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createNote } from '@/lib/notes';

const createNoteSchema = z.object({
  title: z.string().min(1).max(255).optional().default('Untitled note'),
  contentJson: z
    .string()
    .optional()
    .default(JSON.stringify({ type: 'doc', content: [] })),
});

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  return Response.json({ message: 'Not implemented' }, { status: 501 });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = createNoteSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 422 });
  }

  const note = createNote(session.user.id, result.data.title, result.data.contentJson);
  return Response.json({ id: note.id }, { status: 201 });
}
