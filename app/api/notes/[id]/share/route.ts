import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { setNotePublicSharing } from '@/lib/notes';

interface Params {
  params: Promise<{ id: string }>;
}

const shareSchema = z.object({ enable: z.boolean() });

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = shareSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 422 });
  }

  const { id } = await params;
  const note = setNotePublicSharing(session.user.id, id, result.data.enable);
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json({ isPublic: note.isPublic, publicSlug: note.publicSlug });
}
