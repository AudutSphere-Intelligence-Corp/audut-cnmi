// Removed in the Neon migration (Nov 23, 2026): the app no longer talks to
// Supabase. Reports now go through the server-side /api/reports endpoint,
// which reads/writes Neon Postgres. This file is kept only so older imports
// do not break; nothing imports it anymore.
export const supabase = null;
export const isConfigured = false;
