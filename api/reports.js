// GET  /api/reports -> all reports, newest first (from Neon Postgres)
// POST /api/reports -> submit a community report {id, category, title,
//   subtitle, details, tags, owner, timestamp}
// Replaces the old Supabase client (the Supabase project is paused and
// unpaid by PK's choice). Server-side only: DATABASE_URL never reaches
// the browser. Uses @neondatabase/serverless (HTTP driver), same pattern
// as julieogo.com.
import { neon } from '@neondatabase/serverless';

const CATEGORIES = [
  'Emergency Alert',
  'Supply Vendor',
  'Agency Update',
  'Outage Report',
  'Donation Tracking',
  'Debris Cleanup',
  'Zoning Notice',
];

const ISLANDS = [
  'Saipan',
  'Tinian',
  'Rota',
  'Aguiguan',
  'Alamagan',
  'Pagan',
  'Anatahan',
  'Farallon de Medinilla',
  'Managaha',
];

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  return neon(url);
}

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

export default async function handler(req, res) {
  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not configured.' });
  }

  if (req.method === 'GET') {
    try {
      const rows = await db`SELECT id, category, title, subtitle, details,
        status, tags, owner, timestamp, created_at
        FROM reports ORDER BY created_at DESC`;
      return res.status(200).json({ reports: rows || [] });
    } catch (e) {
      console.error('reports GET failed:', e && e.message ? e.message : String(e));
      return res.status(500).json({ error: 'Database unreachable.' });
    }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    const category = clean(b.category, 40);
    const title = clean(b.title, 200);
    const subtitle = clean(b.subtitle, 300);
    const details = clean(b.details, 5000);
    const owner = clean(b.owner, 100);
    const timestamp = clean(b.timestamp, 100);
    const id = clean(b.id, 80);
    const island = (Array.isArray(b.tags) ? b.tags : [])
      .map((t) => String(t).toLowerCase())
      .find((t) => ISLANDS.map((s) => s.toLowerCase()).includes(t));

    if (!id || !/^USER-\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid report id.' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Please select a valid category.' });
    }
    if (!island) {
      return res.status(400).json({ error: 'Please select a valid CNMI island for the report.' });
    }
    if (!title || !subtitle || !details || !owner) {
      return res.status(400).json({ error: 'Please complete all required fields before submitting.' });
    }

    const tags = [category.toLowerCase().replace(/\s+/g, '-'), island];
    try {
      const inserted = await db`INSERT INTO reports
        (id, category, title, subtitle, details, status, tags, owner, timestamp)
        VALUES (${id}, ${category}, ${title}, ${subtitle}, ${details},
          ${'User report'}, ${tags}, ${owner}, ${timestamp || `Submitted ${new Date().toLocaleString()}`})
        RETURNING id`;
      if (!inserted || !inserted[0]) {
        return res.status(500).json({ error: 'Insert failed.' });
      }
      return res.status(201).json({ id: inserted[0].id });
    } catch (e) {
      console.error('reports POST failed:', e && e.message ? e.message : String(e));
      const msg = String((e && e.message) || e);
      if (msg.includes('duplicate key')) {
        return res.status(409).json({ error: 'That report was already submitted.' });
      }
      return res.status(500).json({ error: 'Failed to save report.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed.' });
}
