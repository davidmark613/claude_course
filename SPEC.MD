# Technical Specification – Note Taking Web App

## 1. Overview

A web application where authenticated users can create, view, edit, delete, and publicly share rich-text notes. Notes are created with TipTap, stored as JSON in a SQLite database, and rendered in the browser with formatting.

### Core Features

- User authentication (sign up, login, logout) via better-auth
- Authenticated note management (CRUD)
- Rich text editor using TipTap with:
  - Bold, Italic
  - Heading levels (H1–H3) + normal text
  - Inline code + code blocks
  - Bullet lists
  - Horizontal rules
- Public sharing of notes via a public URL (toggle on/off)

### Tech

- Next.js (App Router) + Bun runtime
- TypeScript
- TailwindCSS
- SQLite via Bun's built-in SQLite client with raw SQL

## 2. Architecture

### 2.1 High-Level Architecture

- **Frontend & Backend:** Next.js (App Router)
  - Server components for data fetching
  - Client components for TipTap editor and interactive UI
  - Route Handlers (`app/api/.../route.ts`) for JSON APIs
- **Runtime:** Bun (for dev & production)
- **Database:** Single SQLite file (e.g., `data/app.db`) accessed via Bun's built-in SQLite client
- **Auth:** better-auth integrated into Next.js (middleware + server helpers)

### 2.2 Application Layers

**Presentation layer**
- Next.js pages and components
- TailwindCSS for styling
- TipTap editor component

**API layer**
- REST-like JSON endpoints for notes CRUD & sharing

**Data access layer**
- Raw SQL queries executed via Bun's SQLite client
- A small helper module for DB access

## 3. Functional Requirements

### 3.1 Authentication

Users can:
- Register (email + password, minimum validation)
- Log in / log out

Authentication state is accessible on server (for SSR) and on client (for protected UI).

Unauthenticated users:
- Can access public shared note URLs (read-only)
- Cannot access dashboard or personal notes

### 3.2 Notes Management (Authenticated)

**Create a new note:**
- Default title: "Untitled note"
- Default empty TipTap document

**View a list of own notes:**
- Show title, last updated at, shared status

**View a single note:**
- Load editor with stored TipTap JSON document

**Update note:**
- Change title
- Change content (TipTap JSON)
- Auto-update `updated_at`

**Delete note:**
- Hard delete

### 3.3 Note Sharing

Users can toggle note "public sharing":

**When enabled:**
- Note gets a unique public slug (e.g. `abcdef1234`)
- Accessible via `/p/{slug}` for anonymous users

**When disabled:**
- Public URL returns 404 / "Note not found"

**Public page rendering:**
- Reads note from DB by `public_slug`
- Shows title and content in read-only mode
- No editing or owner information necessary

## 4. Non-Functional Requirements

**Performance**
- Notes list & note view should load under ~300 ms for typical DB sizes

**Security**
- All note operations are scoped to authenticated user's `user_id`
- Public notes are read-only; no leaked private data in API responses

**Reliability**
- Graceful handling of DB errors

**Maintainability**
- Type-safe APIs and DB types
- Modularized DB and auth helpers

**UX**
- Simple, minimal UI with keyboard-friendly editor

## 5. Data Model & Database Schema (SQLite)

### 5.1 Tables

#### better-auth Tables

better-auth manages its own schema for authentication tables (`user`, `session`, `account`, `verification`). **Do not define these manually.** Instead, generate them using the better-auth CLI:

```bash
# Use bunx --bun to avoid type errors from the bun:sqlite module
bunx --bun @better-auth/cli@latest generate
# or to migrate directly:
bunx --bun @better-auth/cli@latest migrate
```

The better-auth database integration uses Bun's built-in SQLite:

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { Database } from "bun:sqlite";

export const auth = betterAuth({
  database: new Database("data/app.db"),
  // ... other config
});
```

#### notes

```sql
CREATE TABLE notes (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  title        TEXT NOT NULL,
  content_json TEXT NOT NULL,
  is_public    INTEGER NOT NULL DEFAULT 0,
  public_slug  TEXT UNIQUE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### 5.2 Indexes

```sql
CREATE INDEX idx_notes_user_id     ON notes(user_id);
CREATE INDEX idx_notes_public_slug ON notes(public_slug);
CREATE INDEX idx_notes_is_public   ON notes(is_public);
```

## 6. Backend: DB & API Layer

### 6.1 Database Access Module

**File:** `lib/db.ts`

- Initialize Bun SQLite client with DB file (`data/app.db`)
- Export helper functions such as:
  - `getDb()` – returns singleton DB connection
  - Utility wrappers for:
    - `query<T>(sql, params?): T[]`
    - `get<T>(sql, params?): T | undefined`
    - `run(sql, params?)`

### 6.2 Note Repository Functions

**File:** `lib/notes.ts`

**TypeScript types:**

```typescript
export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string; // stringified TipTap doc
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};
```

**Repository functions:**

- `createNote(userId: string, data: { title?: string; contentJson?: string }): Promise<Note>`
- `getNoteById(userId: string, noteId: string): Promise<Note | null>`
- `getNotesByUser(userId: string): Promise<Note[]>`
- `updateNote(userId: string, noteId: string, data: Partial<{ title: string; contentJson: string }>): Promise<Note | null>`
- `deleteNote(userId: string, noteId: string): Promise<void>`
- `setNotePublic(userId: string, noteId: string, isPublic: boolean): Promise<Note | null>`
- `getNoteByPublicSlug(slug: string): Promise<Note | null>`

Each function enforces `user_id = ?` in SQL where applicable, to avoid cross-user access.

## 7. API Design (Next.js Route Handlers)

Base path under `/api/notes`.

### 7.1 Authentication Access

Implement a server helper from better-auth like `getCurrentUser()` or `getSession()`.

All `/api/notes` handlers (except public read) must:
- Check auth
- Return 401 if not authenticated

### 7.2 Endpoints

#### GET /api/notes

**Description:** List notes for current user.

**Response 200:**
```json
[
  {
    "id": "note-id",
    "title": "My Note",
    "isPublic": true,
    "updatedAt": "2025-01-01T12:00:00Z"
  }
]
```

Optionally omit `contentJson` from list responses for performance.

#### POST /api/notes

**Description:** Create a new note.

**Request body (JSON):**
```json
{
  "title": "Optional title",
  "contentJson": { "type": "doc" }
}
```

**Behavior:**
- Default title = "Untitled note" if missing
- Default `contentJson` = empty TipTap document if missing

**Response 201:** Created note (or minimal subset)

#### GET /api/notes/:id

**Description:** Get single note owned by current user.

**Response:**
- 200 with full note including `contentJson`
- 404 if not found or not owned by user

#### PUT /api/notes/:id

**Description:** Update note title/content.

**Request body:**
```json
{
  "title": "New title",
  "contentJson": {}
}
```

**Response:**
- 200 with updated note
- 404 if not found

#### DELETE /api/notes/:id

**Description:** Delete note.

**Response:**
- 204 on success
- 404 if not found

#### POST /api/notes/:id/share

**Description:** Toggle public sharing.

**Request body:**
```json
{
  "isPublic": true
}
```

**Behavior:**
- If `isPublic = true` and note has no `public_slug`, generate new slug (`nanoid()`)
- If `isPublic = false`, set `is_public = 0` and `public_slug = NULL`

**Response 200:**
```json
{
  "id": "note-id",
  "isPublic": true,
  "publicSlug": "abcdef1234"
}
```

### 7.3 Public Note Endpoint

#### GET /api/public-notes/:slug

**Description:** Read-only access to public notes.

**Response 200:**
```json
{
  "title": "Public note",
  "contentJson": {}
}
```

- 404 if slug not found or `is_public = 0`

> Alternatively, skip this API endpoint and resolve the note directly in the `/p/[slug]` route using server components.

## 8. Frontend – Pages & Components

### 8.1 Routes

Next.js App Router structure:

- `/` – Landing page
  - Marketing / "Log in / Sign up" CTA
- `/dashboard` – Authenticated area
  - List of user notes
  - "Create note" button
- `/notes/[id]` – Authenticated note editor page
  - TipTap editor
  - Title field
  - Share toggle
  - Delete button
- `/p/[slug]` – Public note page
  - Read-only content
  - No nav to user-specific area if viewer is unauthenticated

### 8.2 Layout & Navigation

- Global layout: `app/layout.tsx`
  - Header with app name, login/logout/account & theme toggle
- `app/(auth)/login`, `app/(auth)/register` (if better-auth doesn't provide their own UI)

### 8.3 Components

**`components/NoteList.tsx`**
- Props: `notes: { id, title, updatedAt, isPublic }[]`
- Renders list with links to `/notes/[id]`

**`components/NoteEditor.tsx`**
- TipTap-based editor
- Controlled by parent (`onChange` updates state, eventual API call)

**`components/ShareToggle.tsx`**
- Switch/checkbox for `isPublic`
- Shows public URL when enabled

**`components/DeleteNoteButton.tsx`**
- Confirms and calls DELETE API

**`components/PublicNoteViewer.tsx`**
- Renders TipTap content in read-only mode (use `EditorContent` with `editable: false`)

## 9. TipTap Integration

### 9.1 Extensions

Enable at minimum:
- `StarterKit` (with paragraphs, headings, bold, italic, bullet lists, horizontal rule, etc.)
- `Code` (inline code)
- `CodeBlock` (for code snippets)

**Example editor config:**

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Code,
    CodeBlock,
  ],
  content: initialContentJson, // TipTap JSON
  onUpdate: ({ editor }) => {
    const json = editor.getJSON();
    onChange(json);
  },
});
```

Content is stored in DB as `JSON.stringify(json)`; when loading, `JSON.parse` and pass as `content`.

### 9.2 Toolbar

Buttons:
- Bold, Italic
- H1, H2, H3, paragraph
- Bullet list
- Inline code
- Code block
- Horizontal rule

Each button calls the relevant TipTap chain, e.g. `editor.chain().focus().toggleBold().run()`.

## 10. Styling (TailwindCSS)

- Configure Tailwind in `tailwind.config.ts`
- Use a minimal design:
  - Neutral background, card-like note container
  - Utility classes on components
- Consider `@tailwindcss/typography` for prose styling on read-only content

## 11. Security Considerations

**Auth enforcement**
- All `/dashboard` and `/notes/[id]` routes check auth on the server
- API routes verify user and attach `userId` from session

**Authorization**
- Every note query in the auth context filters by `user_id`

**Public notes**
- Slug should be sufficiently random to prevent guessing (16+ chars via `nanoid`)

**XSS**
- Primary data is TipTap JSON, not raw HTML
- When rendering to HTML, only use TipTap's own rendering (no `dangerouslySetInnerHTML` with unsanitized data)

**Rate limiting (optional)**
- Apply per-IP or per-user rate limiting to API routes if exposed publicly

## 12. Development Workflow

1. Initialize Next.js app with Bun & TypeScript
2. Set up TailwindCSS
3. Integrate better-auth and generate schema via `bunx --bun @better-auth/cli@latest migrate`
4. Implement SQLite DB initialization for the `notes` table (e.g. via `scripts/init-db.ts`)
5. Build DB helpers and note repository
6. Implement `/api/notes` and sharing APIs
7. Build dashboard and note editor pages
8. Integrate TipTap editor and toolbar
9. Implement public note pages `/p/[slug]`
10. Add polish (loading states, toast messages, error handling)
