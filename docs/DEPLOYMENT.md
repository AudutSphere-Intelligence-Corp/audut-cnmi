# Deployment Plan

This document describes the recommended deployment for Audut CNMI.

## Hosting

- Frontend: Vercel is recommended for easy publishing and custom domain support.
- Backend / data: Supabase is a good match for open source app development, with Postgres, storage, and auth.

## Recommended workflow

1. Create a GitHub repository under `AudutSphere Intelligence Corp/audut-cnmi`.
2. Connect the repository to Vercel.
3. Configure the project in Vercel with build command `npm run build` and output directory `dist`.
4. Add a custom domain in Vercel once purchased.

## Environment variables

This starter app does not yet require backend environment variables.
Future backend integrations should use `.env` and `.env.example`.

## Supabase integration (future)

For open source deployment, use Supabase for database and storage.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Store secrets in Vercel environment variables, not in source control.
