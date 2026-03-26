import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  get: vi.fn(),
  run: vi.fn(),
  getDb: vi.fn(),
}));

import { generateSlug } from '@/lib/notes';

describe('generateSlug', () => {
  it('returns a string of exactly 16 characters', () => {
    expect(generateSlug()).toHaveLength(16);
  });

  it('only contains URL-safe characters [A-Za-z0-9\\-_]', () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('never contains +, /, or = characters', () => {
    for (let i = 0; i < 50; i++) {
      const slug = generateSlug();
      expect(slug).not.toMatch(/[+/=]/);
    }
  });

  it('returns different values across 100 calls', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });
});
