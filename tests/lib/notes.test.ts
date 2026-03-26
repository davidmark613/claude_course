import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  get: vi.fn(),
  run: vi.fn(),
  getDb: vi.fn(),
}));

import { get, query, run } from '@/lib/db';
import {
  createNote,
  getNotesByUser,
  getNoteById,
  getNoteByPublicSlug,
  deleteNote,
  updateNote,
  setNotePublicSharing,
} from '@/lib/notes';
import type { Note } from '@/lib/notes';

const mockGet = vi.mocked(get);
const mockQuery = vi.mocked(query);
const mockRun = vi.mocked(run);

const makeRow = (overrides = {}) => ({
  id: 'note-1',
  user_id: 'user-1',
  title: 'Test Note',
  content_json: '{"type":"doc"}',
  is_public: 0,
  public_slug: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const expectedNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  contentJson: '{"type":"doc"}',
  isPublic: false,
  publicSlug: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createNote ──────────────────────────────────────────────────────────────

describe('createNote', () => {
  it('calls run() with INSERT INTO notes SQL', () => {
    createNote('user-1', 'My Note', '{}');
    expect(mockRun).toHaveBeenCalledOnce();
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toMatch(/INSERT INTO notes/i);
  });

  it('passes userId, title, contentJson as SQL parameters', () => {
    createNote('user-1', 'My Note', '{"type":"doc"}');
    const params = mockRun.mock.calls[0][1] as unknown[];
    expect(params).toContain('user-1');
    expect(params).toContain('My Note');
    expect(params).toContain('{"type":"doc"}');
  });

  it('returns a Note with the correct userId, title, and contentJson', () => {
    const note = createNote('user-1', 'My Note', '{}');
    expect(note.userId).toBe('user-1');
    expect(note.title).toBe('My Note');
    expect(note.contentJson).toBe('{}');
  });

  it('returns isPublic: false and publicSlug: null', () => {
    const note = createNote('user-1', 'My Note', '{}');
    expect(note.isPublic).toBe(false);
    expect(note.publicSlug).toBeNull();
  });

  it('returns a Note with a valid UUID as id', () => {
    const note = createNote('user-1', 'My Note', '{}');
    expect(note.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns matching createdAt and updatedAt timestamps', () => {
    const note = createNote('user-1', 'My Note', '{}');
    expect(note.createdAt).toBe(note.updatedAt);
    expect(new Date(note.createdAt).getTime()).toBeGreaterThan(0);
  });
});

// ─── getNotesByUser ───────────────────────────────────────────────────────────

describe('getNotesByUser', () => {
  it('calls query() with user_id = ? and the provided userId', () => {
    mockQuery.mockReturnValue([]);
    getNotesByUser('user-1');
    expect(mockQuery).toHaveBeenCalledOnce();
    const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('user_id = ?');
    expect(params).toContain('user-1');
  });

  it('returns an empty array when query() returns []', () => {
    mockQuery.mockReturnValue([]);
    expect(getNotesByUser('user-1')).toEqual([]);
  });

  it('maps NoteRow snake_case fields to Note camelCase fields', () => {
    mockQuery.mockReturnValue([makeRow()]);
    const [note] = getNotesByUser('user-1');
    expect(note.userId).toBe('user-1');
    expect(note.contentJson).toBe('{"type":"doc"}');
    expect(note.isPublic).toBe(false);
    expect(note.publicSlug).toBeNull();
    expect(note.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(note.updatedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('maps is_public=1 to isPublic: true', () => {
    mockQuery.mockReturnValue([makeRow({ is_public: 1, public_slug: 'abc123' })]);
    const [note] = getNotesByUser('user-1');
    expect(note.isPublic).toBe(true);
    expect(note.publicSlug).toBe('abc123');
  });

  it('maps is_public=0 to isPublic: false', () => {
    mockQuery.mockReturnValue([makeRow({ is_public: 0 })]);
    const [note] = getNotesByUser('user-1');
    expect(note.isPublic).toBe(false);
  });

  it('returns multiple notes preserving order', () => {
    mockQuery.mockReturnValue([makeRow({ id: 'note-1' }), makeRow({ id: 'note-2' })]);
    const notes = getNotesByUser('user-1');
    expect(notes).toHaveLength(2);
    expect(notes[0].id).toBe('note-1');
    expect(notes[1].id).toBe('note-2');
  });
});

// ─── getNoteById ─────────────────────────────────────────────────────────────

describe('getNoteById', () => {
  it('calls get() with the correct SQL, noteId, and userId', () => {
    mockGet.mockReturnValue(undefined);
    getNoteById('user-1', 'note-1');
    expect(mockGet).toHaveBeenCalledOnce();
    const [sql, params] = mockGet.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/WHERE id = \? AND user_id = \?/);
    expect(params).toContain('note-1');
    expect(params).toContain('user-1');
  });

  it('returns null when get() returns undefined', () => {
    mockGet.mockReturnValue(undefined);
    expect(getNoteById('user-1', 'note-1')).toBeNull();
  });

  it('returns a mapped Note when get() returns a row', () => {
    mockGet.mockReturnValue(makeRow());
    expect(getNoteById('user-1', 'note-1')).toEqual(expectedNote());
  });
});

// ─── getNoteByPublicSlug ──────────────────────────────────────────────────────

describe('getNoteByPublicSlug', () => {
  it('queries with public_slug = ? AND is_public = 1', () => {
    mockGet.mockReturnValue(undefined);
    getNoteByPublicSlug('abc123');
    const [sql, params] = mockGet.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('public_slug = ?');
    expect(sql).toContain('is_public = 1');
    expect(params).toContain('abc123');
  });

  it('returns null when no row found', () => {
    mockGet.mockReturnValue(undefined);
    expect(getNoteByPublicSlug('abc123')).toBeNull();
  });

  it('returns a mapped Note when row found', () => {
    mockGet.mockReturnValue(makeRow({ is_public: 1, public_slug: 'abc123' }));
    const note = getNoteByPublicSlug('abc123');
    expect(note).not.toBeNull();
    expect(note!.isPublic).toBe(true);
    expect(note!.publicSlug).toBe('abc123');
  });
});

// ─── deleteNote ───────────────────────────────────────────────────────────────

describe('deleteNote', () => {
  it('returns false when note does not exist', () => {
    mockGet.mockReturnValue(undefined);
    expect(deleteNote('user-1', 'note-1')).toBe(false);
  });

  it('does not call run() when note does not exist', () => {
    mockGet.mockReturnValue(undefined);
    deleteNote('user-1', 'note-1');
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('calls run() with DELETE SQL when note exists', () => {
    mockGet.mockReturnValue(makeRow());
    deleteNote('user-1', 'note-1');
    expect(mockRun).toHaveBeenCalledOnce();
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toMatch(/DELETE FROM notes/i);
  });

  it('returns true after successful deletion', () => {
    mockGet.mockReturnValue(makeRow());
    expect(deleteNote('user-1', 'note-1')).toBe(true);
  });
});

// ─── updateNote ───────────────────────────────────────────────────────────────

describe('updateNote', () => {
  it('always includes updated_at in the SET clause', () => {
    mockGet.mockReturnValue(makeRow());
    updateNote('user-1', 'note-1', {});
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toContain('updated_at = ?');
  });

  it('includes title in SET clause when data.title is provided', () => {
    mockGet.mockReturnValue(makeRow());
    updateNote('user-1', 'note-1', { title: 'New Title' });
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toContain('title = ?');
  });

  it('includes content_json in SET clause when data.contentJson is provided', () => {
    mockGet.mockReturnValue(makeRow());
    updateNote('user-1', 'note-1', { contentJson: '{}' });
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toContain('content_json = ?');
  });

  it('omits title from SET clause when data.title is undefined', () => {
    mockGet.mockReturnValue(makeRow());
    updateNote('user-1', 'note-1', { contentJson: '{}' });
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).not.toContain('title = ?');
  });

  it('omits content_json from SET clause when data.contentJson is undefined', () => {
    mockGet.mockReturnValue(makeRow());
    updateNote('user-1', 'note-1', { title: 'Only Title' });
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).not.toContain('content_json = ?');
  });

  it('appends noteId and userId as the final two parameters', () => {
    mockGet.mockReturnValue(makeRow());
    updateNote('user-1', 'note-1', { title: 'New Title' });
    const params = mockRun.mock.calls[0][1] as unknown[];
    expect(params[params.length - 2]).toBe('note-1');
    expect(params[params.length - 1]).toBe('user-1');
  });

  it('returns null when note does not exist after update', () => {
    mockGet.mockReturnValue(undefined);
    expect(updateNote('user-1', 'note-1', { title: 'x' })).toBeNull();
  });

  it('returns the updated Note when note exists', () => {
    mockGet.mockReturnValue(makeRow({ title: 'New Title' }));
    const note = updateNote('user-1', 'note-1', { title: 'New Title' });
    expect(note).not.toBeNull();
    expect(note!.title).toBe('New Title');
  });
});

// ─── setNotePublicSharing ─────────────────────────────────────────────────────

describe('setNotePublicSharing', () => {
  it('when enable=true: calls run() with is_public=1', () => {
    mockGet.mockReturnValue(makeRow({ is_public: 1, public_slug: 'slug123' }));
    setNotePublicSharing('user-1', 'note-1', true);
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toContain('is_public = 1');
  });

  it('when enable=true: the slug param is 16 chars long', () => {
    mockGet.mockReturnValue(makeRow({ is_public: 1, public_slug: 'slug123' }));
    setNotePublicSharing('user-1', 'note-1', true);
    const params = mockRun.mock.calls[0][1] as unknown[];
    // params[0] is the slug
    expect(typeof params[0]).toBe('string');
    expect(params[0] as string).toHaveLength(16);
  });

  it('when enable=false: calls run() with is_public=0 and public_slug=NULL', () => {
    mockGet.mockReturnValue(makeRow({ is_public: 0, public_slug: null }));
    setNotePublicSharing('user-1', 'note-1', false);
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toContain('is_public = 0');
    expect(sql).toContain('public_slug = NULL');
  });

  it('when enable=false: does not pass a slug as first param', () => {
    mockGet.mockReturnValue(makeRow({ is_public: 0, public_slug: null }));
    setNotePublicSharing('user-1', 'note-1', false);
    const params = mockRun.mock.calls[0][1] as unknown[];
    // First param is the timestamp (a string date), not a slug
    expect(params[0]).not.toHaveLength(16);
  });

  it('returns null when note does not exist', () => {
    mockGet.mockReturnValue(undefined);
    expect(setNotePublicSharing('user-1', 'note-1', true)).toBeNull();
  });

  it('returns the updated Note after enabling sharing', () => {
    mockGet.mockReturnValue(makeRow({ is_public: 1, public_slug: 'abc123xyz123abc1' }));
    const note = setNotePublicSharing('user-1', 'note-1', true);
    expect(note).not.toBeNull();
    expect(note!.isPublic).toBe(true);
    expect(note!.publicSlug).toBe('abc123xyz123abc1');
  });

  it('returns the updated Note after disabling sharing', () => {
    mockGet.mockReturnValue(makeRow({ is_public: 0, public_slug: null }));
    const note = setNotePublicSharing('user-1', 'note-1', false);
    expect(note).not.toBeNull();
    expect(note!.isPublic).toBe(false);
    expect(note!.publicSlug).toBeNull();
  });
});
