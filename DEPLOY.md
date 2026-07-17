# Deploying Better (Supabase + Vercel)

Better runs on Next.js with a Postgres database (Supabase) and is hosted on
Vercel. This guide lists the one-time setup.

## Environment variables

Set all of these in **Vercel → Project → Settings → Environment Variables**
(Production, and Preview if you use it):

| Variable | What it is | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | Pooled connection (app runtime) | Supabase → Connect → ORMs → Prisma → **Transaction** URL (port 6543) |
| `DIRECT_URL` | Direct connection (migrations) | Supabase → Connect → ORMs → Prisma → **Direct** URL (port 5432) |
| `SESSION_SECRET` | Encrypts the login cookie | A random 32-byte hex string (generate one; keep it secret) |
| `SUPABASE_URL` | Project URL | Supabase → Settings → Data API → Project URL (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only storage key | Supabase → Settings → API Keys → `service_role` (secret) |

`SUPABASE_STORAGE_BUCKET` is optional (defaults to `uploads`). The bucket is
created automatically on the first image upload.

The Anthropic API key is **not** an env var — it is entered inside the app
(✨ button in the top bar) and stored in the database.

## Supabase

1. Create a free project. Choose a database password you'll remember (it's
   part of the connection strings).
2. Copy the two Prisma connection strings and the service-role key (see table).

## Vercel

1. Import the `better` GitHub repo.
2. Add the environment variables above.
3. Deploy. The build runs `prisma migrate deploy` (creates all tables) then
   `next build`.

## First run

Open the deployed URL → set your 6-digit passcode → click ✨ to add your
Anthropic API key. The app starts empty (no demo data in production).

## Notes

- Database migrations live in `prisma/migrations` and are applied at build.
- Note images and expense receipts upload to Supabase Storage via
  `/api/upload` (server-side, service-role key never reaches the browser).
- If the app can't connect to the database, confirm the connection strings and
  add `?sslmode=require` to `DATABASE_URL` / `DIRECT_URL`.
