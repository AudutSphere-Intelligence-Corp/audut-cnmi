# Supabase Setup for Audut CNMI

Your app now uses **Supabase** for persistent data storage. Reports submitted via the form are automatically saved to a PostgreSQL database and synced across all users in real-time.

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is fine for MVP)
2. Create a new project
3. Copy your project URL and anon key from **Settings → API**

### 2. Add Environment Variables

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project dashboard.

### 3. Create the `reports` Table

In Supabase, go to **SQL Editor** and run:

```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  owner TEXT,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time
ALTER TABLE reports REPLICA IDENTITY FULL;
```

### 4. Set Row Level Security (RLS)

For the MVP (public submissions), disable RLS or allow public read/write:

```sql
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Or, to allow public read/write:
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read" ON reports FOR SELECT USING (true);
CREATE POLICY "allow_public_insert" ON reports FOR INSERT WITH CHECK (true);
```

### 5. Test Locally

```bash
npm run dev
```

- Submit a test report from the form
- You should see it appear immediately in the card deck
- Open the app in another tab or browser—the card should appear automatically (real-time sync)

## How It Works

### Data Flow

1. **User submits form** → validates CNMI island
2. **Stored in Supabase** → persists across page reloads, devices, and users
3. **Real-time subscription** → all connected clients see new reports instantly
4. **Fallback mode** → if Supabase is not configured, reports stay in memory (no persistence)

### Status Indicators

The hero panel shows:
- ✓ Connected to Supabase (green)
- Loading reports... (while fetching)
- ⚠ Database connection error (red)
- Nothing = Supabase not configured (falls back to in-memory)

## Deployment

### Deploy to Vercel

The app already has a `vercel.json` config. Set environment variables in Vercel dashboard:

1. Go to your Vercel project settings
2. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redeploy

### Deploy to Azure Static Web Apps

If using the Azure deployment script in `scripts/deploy-azure.ps1`:

1. Add the same environment variables to your GitHub repository secrets
2. The CI/CD pipeline will inject them during the build

## Troubleshooting

### "Database connection error" message?

- Check `.env.local` has correct URL and key
- Verify the `reports` table exists in Supabase
- Check Supabase project is active (not paused)
- Open browser console (F12) for error details

### Reports not appearing after submit?

- Check the Supabase table for rows (`SELECT * FROM reports`)
- If empty, the insert failed—check error message in the form
- Real-time only works if `REPLICA IDENTITY FULL` is set on the table

### Can't insert reports?

- Verify RLS is disabled or policies allow public inserts
- Check VITE_SUPABASE_ANON_KEY is correct (not the service role key)

## Future Enhancements

- Add user authentication (email, GitHub login)
- Moderate/delete reports (admin panel)
- Add timestamps and user identification
- Archive old reports
- Search and filter by tags
- Backup to S3 or Azure Blob

## References

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
