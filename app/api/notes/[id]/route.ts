import { getSession } from '@/lib/auth';
import { getNoteById, updateNote, deleteNote } from '@/lib/notes';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const note = getNoteById(session.user.id, id);
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json(note);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Partial<{ title: string; contentJson: string }> = {};
  if (typeof body.title === 'string') data.title = body.title;
  if (typeof body.contentJson === 'string') data.contentJson = body.contentJson;

  const note = updateNote(session.user.id, id, data);
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json(note);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const deleted = deleteNote(session.user.id, id);
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 });

  return new Response(null, { status: 204 });
}
