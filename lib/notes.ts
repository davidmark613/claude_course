import { get, query, run } from '@/lib/db';

export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  content_json: string;
  is_public: number;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contentJson: row.content_json,
    isPublic: row.is_public === 1,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createNote(userId: string, title: string, contentJson: string): Note {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  run(
    `INSERT INTO notes (id, user_id, title, content_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, title, contentJson, now, now],
  );
  return {
    id,
    userId,
    title,
    contentJson,
    isPublic: false,
    publicSlug: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function getNotesByUser(userId: string): Note[] {
  const rows = query<NoteRow>(`SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC`, [
    userId,
  ]);
  return rows.map(toNote);
}

export function getNoteByPublicSlug(slug: string): Note | null {
  const row = get<NoteRow>(`SELECT * FROM notes WHERE public_slug = ? AND is_public = 1`, [slug]);
  return row ? toNote(row) : null;
}

export function getNoteById(userId: string, noteId: string): Note | null {
  const row = get<NoteRow>(`SELECT * FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId]);
  return row ? toNote(row) : null;
}

export function deleteNote(userId: string, noteId: string): boolean {
  const exists = getNoteById(userId, noteId);
  if (!exists) return false;
  run(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId]);
  return true;
}

export function generateSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, 16);
}

export function setNotePublicSharing(userId: string, noteId: string, enable: boolean): Note | null {
  const now = new Date().toISOString();
  if (enable) {
    const slug = generateSlug();
    run(
      `UPDATE notes SET is_public = 1, public_slug = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
      [slug, now, noteId, userId],
    );
  } else {
    run(
      `UPDATE notes SET is_public = 0, public_slug = NULL, updated_at = ? WHERE id = ? AND user_id = ?`,
      [now, noteId, userId],
    );
  }
  return getNoteById(userId, noteId);
}

export function updateNote(
  userId: string,
  noteId: string,
  data: Partial<{ title: string; contentJson: string }>,
): Note | null {
  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const params: unknown[] = [now];

  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }
  if (data.contentJson !== undefined) {
    fields.push('content_json = ?');
    params.push(data.contentJson);
  }

  params.push(noteId, userId);
  run(`UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, params);

  return getNoteById(userId, noteId);
}
