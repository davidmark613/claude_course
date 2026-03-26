import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/notes', () => ({ setNotePublicSharing: vi.fn() }));

import { getSession } from '@/lib/auth';
import { setNotePublicSharing } from '@/lib/notes';
import { POST } from '@/app/api/notes/[id]/share/route';
import type { Note } from '@/lib/notes';

const mockGetSession = vi.mocked(getSession);
const mockSetNotePublicSharing = vi.mocked(setNotePublicSharing);

const session = { user: { id: 'user-1' } } as Awaited<ReturnType<typeof getSession>>;
const params = { params: Promise.resolve({ id: 'note-1' }) };

const fakeNote: Note = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  contentJson: '{}',
  isPublic: true,
  publicSlug: 'abc123xyz123abc1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function makeRequest(body: unknown) {
  return new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeBadJsonRequest() {
  return new Request('http://localhost', {
    method: 'POST',
    body: 'not-json',
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/notes/[id]/share', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ enable: true }), params);
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is not valid JSON', async () => {
    mockGetSession.mockResolvedValue(session);
    const res = await POST(makeBadJsonRequest(), params);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid JSON' });
  });

  it('returns 422 when "enable" field is missing', async () => {
    mockGetSession.mockResolvedValue(session);
    const res = await POST(makeRequest({}), params);
    expect(res.status).toBe(422);
  });

  it('returns 422 when "enable" is a string instead of boolean', async () => {
    mockGetSession.mockResolvedValue(session);
    const res = await POST(makeRequest({ enable: 'true' }), params);
    expect(res.status).toBe(422);
  });

  it('returns a flattened Zod error on 422', async () => {
    mockGetSession.mockResolvedValue(session);
    const res = await POST(makeRequest({ enable: 'yes' }), params);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 404 when setNotePublicSharing returns null', async () => {
    mockGetSession.mockResolvedValue(session);
    mockSetNotePublicSharing.mockReturnValue(null);
    const res = await POST(makeRequest({ enable: true }), params);
    expect(res.status).toBe(404);
  });

  it('returns 200 with { isPublic: true, publicSlug } when enable=true', async () => {
    mockGetSession.mockResolvedValue(session);
    mockSetNotePublicSharing.mockReturnValue(fakeNote);
    const res = await POST(makeRequest({ enable: true }), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ isPublic: true, publicSlug: 'abc123xyz123abc1' });
  });

  it('returns 200 with { isPublic: false, publicSlug: null } when enable=false', async () => {
    mockGetSession.mockResolvedValue(session);
    mockSetNotePublicSharing.mockReturnValue({ ...fakeNote, isPublic: false, publicSlug: null });
    const res = await POST(makeRequest({ enable: false }), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ isPublic: false, publicSlug: null });
  });

  it('calls setNotePublicSharing with session.user.id, noteId, and enable', async () => {
    mockGetSession.mockResolvedValue(session);
    mockSetNotePublicSharing.mockReturnValue(fakeNote);
    await POST(makeRequest({ enable: true }), params);
    expect(mockSetNotePublicSharing).toHaveBeenCalledWith('user-1', 'note-1', true);
  });

  it('passes enable=false to setNotePublicSharing correctly', async () => {
    mockGetSession.mockResolvedValue(session);
    mockSetNotePublicSharing.mockReturnValue({ ...fakeNote, isPublic: false, publicSlug: null });
    await POST(makeRequest({ enable: false }), params);
    expect(mockSetNotePublicSharing).toHaveBeenCalledWith('user-1', 'note-1', false);
  });
});
