# Better

A fast, warm, single-user command center for a Chief of Staff role — a Kanban/list/calendar task board and a notes system with meeting mode, tied together with a command palette, global quick-add, and weekly digest.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions) — one codebase for frontend + backend
- **Prisma 7** + **SQLite** (via `@prisma/adapter-better-sqlite3`) for local dev — swappable to Postgres for production
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives) for the warm, rounded, minimal design system
- **Tiptap** for rich text (task descriptions, notes — headers, checkboxes, tables)
- **dnd-kit** for Kanban drag-and-drop
- **iron-session** for the single-passcode auth cookie

## Running locally

Requires Node.js 20.9+.

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npx prisma db seed       # loads sample tasks/notes/tags so the app isn't empty
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first visit you'll be asked to choose a 6-digit passcode (stored hashed in the database) — after that, you'll be asked to enter it. Change it any time from the settings icon in the top bar.

## Environment variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — `file:./dev.db` locally; a Postgres connection string in production
- `SESSION_SECRET` — 32+ byte random hex string (`openssl rand -hex 32`) used to encrypt the session cookie

## Deploying

The app is a standard Next.js app and runs anywhere Next.js does (Render, Railway, Fly.io, a VPS, etc.):

1. Switch `prisma/schema.prisma`'s datasource `provider` from `"sqlite"` to `"postgresql"`, and swap the driver adapter in `src/lib/db.ts` from `@prisma/adapter-better-sqlite3` to `@prisma/adapter-pg` (or your Postgres host's adapter), pointed at `DATABASE_URL`.
2. Set `DATABASE_URL` and `SESSION_SECRET` as environment variables on the host.
3. Run `npx prisma migrate deploy` against the production database, then `npx prisma db seed` if you want the sample data.
4. `npm run build && npm run start`. Visit the app once to set your passcode.

## Project layout

- `src/app/(app)/` — authenticated routes (Today dashboard, Board with Kanban/List/Calendar tabs, Notes, Weekly digest)
- `src/app/actions/` — server actions (all data mutations)
- `src/lib/queries/` — server-side data fetching helpers
- `src/components/board/`, `src/components/notes/`, `src/components/app-shell/` — feature UI
- `prisma/schema.prisma` — data model; `prisma/seed.ts` — sample data

## Data export / backup

The download icon in the top bar exports all data as JSON or tasks as CSV, and can re-import a previously exported JSON file (merges by ID — safe to re-run).
