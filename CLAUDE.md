# CLAUDE.md

We're building the app described in $SPEC.MD. Read that file for general architectural tasks or to double-check the exact database structure, tech stack or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Whenever working with any third-party library or something similar, you MUST look up the official documentation to
ensure that you're working with up-to-date information.
Use the DocsExplorer subagent for efficient documentation lookup.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server
bun run build    # Build for production
bun run lint     # Run ESLint
```

### Database setup

```bash
# Generate/migrate better-auth tables (must use --bun to avoid bun:sqlite module errors)
bunx --bun @better-auth/cli@latest migrate

# Initialize notes table
bun run scripts/init-db.ts
```

## Architecture

This is a **Next.js 16 App Router** app running on the **Bun runtime** with TypeScript and TailwindCSS 4.

### Stack

- **Auth:** `better-auth` — integrated via `lib/auth.ts` using Bun's native SQLite (`bun:sqlite`). Auth tables are auto-generated; never define them manually.
- **Database:** SQLite at `data/app.db` via Bun's built-in `bun:sqlite`. DB helpers live in `lib/db.ts` (singleton connection, `query<T>`, `get<T>`, `run` wrappers). Note repository functions in `lib/notes.ts`.
- **Editor:** TipTap v3 (`@tiptap/react`, `@tiptap/starter-kit`). Notes store content as `JSON.stringify(editor.getJSON())` in the `content_json` column, parsed back on load.
- **Validation:** Zod v4

### Key routes

| Path                       | Description                         |
| -------------------------- | ----------------------------------- |
| `/`                        | Landing page                        |
| `/dashboard`               | Auth-protected notes list           |
| `/notes/[id]`              | Auth-protected note editor (TipTap) |
| `/p/[slug]`                | Public read-only note view          |
| `/api/notes`               | CRUD endpoints (auth required)      |
| `/api/notes/[id]/share`    | Toggle public sharing               |
| `/api/public-notes/[slug]` | Public note read (no auth)          |

### Auth pattern

Use `getCurrentUser()` / `getSession()` from `lib/auth.ts` in server components and route handlers. All `/dashboard` and `/notes/[id]` routes redirect unauthenticated users. Every note SQL query filters by `user_id` to enforce ownership.

### Public sharing

When sharing is enabled, a 16-char `nanoid()` slug is generated and stored in `public_slug`. Disabling sets `is_public = 0` and `public_slug = NULL`. The `/p/[slug]` route renders TipTap content in read-only mode (`editable: false`) — never use `dangerouslySetInnerHTML` with TipTap output.

### Environment variables

Copy `.env.example` to `.env.local`. Required vars:

- `BETTER_AUTH_SECRET` — must be 32+ characters
- `DB_PATH` — path to SQLite file (default: `data/app.db`)
