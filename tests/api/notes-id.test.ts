import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/notes', () => ({
  getNoteById: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

import { getSession } from '@/lib/auth';
import { getNoteById, updateNote, deleteNote } from '@/lib/notes';
import { GET, PUT, DELETE } from '@/app/api/notes/[id]/route';
import type { Note } from '@/lib/notes';

const mockGetSession = vi.mocked(getSession);
const mockGetNoteById = vi.mocked(getNoteById);
const mockUpdateNote = vi.mocked(updateNote);
const mockDeleteNote = vi.mocked(deleteNote);

const session = { user: { id: 'user-1' } } as Awaited<ReturnType<typeof getSession>>;
const params = { params: Promise.resolve({ id: 'note-1' }) };

const fakeNote: Note = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  contentJson: '{"type":"doc"}',
  isPublic: false,
  publicSlug: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/notes/[id] ──────────────────────────────────────────────────────

describe('GET /api/notes/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(new Request('http://localhost'), params);
    expect(res.status).toBe(401);
  });

  it('returns 404 when note not found', async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetNoteById.mockReturnValue(null);
    const res = await GET(new Request('http://localhost'), params);
    expect(res.status).toBe(404);
  });

  it('returns 200 with note JSON when found', async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetNoteById.mockReturnValue(fakeNote);
    const res = await GET(new Request('http://localhost'), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fakeNote);
  });

  it('calls getNoteById with session.user.id and route param id', async () => {
    mockGetSession.mockResolvedValue(session);
    mockGetNoteById.mockReturnValue(fakeNote);
    await GET(new Request('http://localhost'), params);
    expect(mockGetNoteById).toHaveBeenCalledWith('user-1', 'note-1');
  });
});

// ─── PUT /api/notes/[id] ──────────────────────────────────────────────────────

describe('PUT /api/notes/[id]', () => {
  function putReq(body: unknown) {
    return new Request('http://localhost', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await PUT(putReq({}), params);
    expect(res.status).toBe(401);
  });

  it('returns 404 when updateNote returns null', async () => {
    mockGetSession.mockResolvedValue(session);
    mockUpdateNote.mockReturnValue(null);
    const res = await PUT(putReq({ title: 'x' }), params);
    expect(res.status).toBe(404);
  });

  it('returns 200 with updated note', async () => {
    mockGetSession.mockResolvedValue(session);
    mockUpdateNote.mockReturnValue({ ...fakeNote, title: 'Updated' });
    const res = await PUT(putReq({ title: 'Updated' }), params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated');
  });

  it('passes title to updateNote when body.title is a string', async () => {
    mockGetSession.mockResolvedValue(session);
    mockUpdateNote.mockReturnValue(fakeNote);
    await PUT(putReq({ title: 'New Title' }), params);
    expect(mockUpdateNote).toHaveBeenCalledWith(
      'user-1',
      'note-1',
      expect.objectContaining({ title: 'New Title' }),
    );
  });

  it('passes contentJson to updateNote when body.contentJson is a string', async () => {
    mockGetSession.mockResolvedValue(session);
    mockUpdateNote.mockReturnValue(fakeNote);
    await PUT(putReq({ contentJson: '{"type":"doc"}' }), params);
    expect(mockUpdateNote).toHaveBeenCalledWith(
      'user-1',
      'note-1',
      expect.objectContaining({ contentJson: '{"type":"doc"}' }),
    );
  });

  it('omits title when body.title is not a string', async () => {
    mockGetSession.mockResolvedValue(session);
    mockUpdateNote.mockReturnValue(fakeNote);
    await PUT(putReq({ title: 42 }), params);
    const data = mockUpdateNote.mock.calls[0][2];
    expect(data).not.toHaveProperty('title');
  });

  it('omits contentJson when body.contentJson is not a string', async () => {
    mockGetSession.mockResolvedValue(session);
    mockUpdateNote.mockReturnValue(fakeNote);
    await PUT(putReq({ contentJson: { type: 'doc' } }), params);
    const data = mockUpdateNote.mock.calls[0][2];
    expect(data).not.toHaveProperty('contentJson');
  });

  it('calls updateNote with session.user.id and route param id', async () => {
    mockGetSession.mockResolvedValue(session);
    mockUpdateNote.mockReturnValue(fakeNote);
    await PUT(putReq({ title: 'x' }), params);
    expect(mockUpdateNote).toHaveBeenCalledWith('user-1', 'note-1', expect.any(Object));
  });
});

// ─── DELETE /api/notes/[id] ───────────────────────────────────────────────────

describe('DELETE /api/notes/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await DELETE(new Request('http://localhost'), params);
    expect(res.status).toBe(401);
  });

  it('returns 404 when deleteNote returns false', async () => {
    mockGetSession.mockResolvedValue(session);
    mockDeleteNote.mockReturnValue(false);
    const res = await DELETE(new Request('http://localhost'), params);
    expect(res.status).toBe(404);
  });

  it('returns 204 with no body when deleteNote returns true', async () => {
    mockGetSession.mockResolvedValue(session);
    mockDeleteNote.mockReturnValue(true);
    const res = await DELETE(new Request('http://localhost'), params);
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });

  it('calls deleteNote with session.user.id and route param id', async () => {
    mockGetSession.mockResolvedValue(session);
    mockDeleteNote.mockReturnValue(true);
    await DELETE(new Request('http://localhost'), params);
    expect(mockDeleteNote).toHaveBeenCalledWith('user-1', 'note-1');
  });
});
