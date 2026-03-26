import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/notes', () => ({ createNote: vi.fn() }));

import { getSession } from '@/lib/auth';
import { createNote } from '@/lib/notes';
import { GET, POST } from '@/app/api/notes/route';

const mockGetSession = vi.mocked(getSession);
const mockCreateNote = vi.mocked(createNote);

const session = { user: { id: 'user-1' } } as Awaited<ReturnType<typeof getSession>>;

function makeRequest(body: unknown, method = 'POST') {
  return new Request('http://localhost/api/notes', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/notes ───────────────────────────────────────────────────────────

describe('GET /api/notes', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 501 when authenticated', async () => {
    mockGetSession.mockResolvedValue(session);
    const res = await GET();
    expect(res.status).toBe(501);
  });
});

// ─── POST /api/notes ──────────────────────────────────────────────────────────

describe('POST /api/notes', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ title: 'Test' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when body is not valid JSON', async () => {
    mockGetSession.mockResolvedValue(session);
    const req = new Request('http://localhost/api/notes', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid JSON' });
  });

  it('returns 422 when title is an empty string', async () => {
    mockGetSession.mockResolvedValue(session);
    const res = await POST(makeRequest({ title: '' }));
    expect(res.status).toBe(422);
  });

  it('returns a flattened Zod error object on 422', async () => {
    mockGetSession.mockResolvedValue(session);
    const res = await POST(makeRequest({ title: '' }));
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 201 with { id } on valid body', async () => {
    mockGetSession.mockResolvedValue(session);
    mockCreateNote.mockReturnValue({ id: 'new-note-id' } as ReturnType<typeof createNote>);
    const res = await POST(makeRequest({ title: 'My Note', contentJson: '{}' }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 'new-note-id' });
  });

  it('calls createNote with session.user.id, title, and contentJson', async () => {
    mockGetSession.mockResolvedValue(session);
    mockCreateNote.mockReturnValue({ id: 'x' } as ReturnType<typeof createNote>);
    await POST(makeRequest({ title: 'Note', contentJson: '{"type":"doc"}' }));
    expect(mockCreateNote).toHaveBeenCalledWith('user-1', 'Note', '{"type":"doc"}');
  });

  it('uses default title "Untitled note" when title is omitted', async () => {
    mockGetSession.mockResolvedValue(session);
    mockCreateNote.mockReturnValue({ id: 'x' } as ReturnType<typeof createNote>);
    await POST(makeRequest({}));
    expect(mockCreateNote).toHaveBeenCalledWith('user-1', 'Untitled note', expect.any(String));
  });

  it('uses empty doc as default contentJson when omitted', async () => {
    mockGetSession.mockResolvedValue(session);
    mockCreateNote.mockReturnValue({ id: 'x' } as ReturnType<typeof createNote>);
    await POST(makeRequest({}));
    const contentJson = mockCreateNote.mock.calls[0][2];
    expect(JSON.parse(contentJson)).toEqual({ type: 'doc', content: [] });
  });

  it('passes provided title to createNote', async () => {
    mockGetSession.mockResolvedValue(session);
    mockCreateNote.mockReturnValue({ id: 'x' } as ReturnType<typeof createNote>);
    await POST(makeRequest({ title: 'Custom Title' }));
    expect(mockCreateNote).toHaveBeenCalledWith('user-1', 'Custom Title', expect.any(String));
  });
});
