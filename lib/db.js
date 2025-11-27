// lib/db.js
import { Pool } from 'pg';

let pool;

/**
 * Kết nối Postgres (Supabase)
 */
export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL chưa được cấu hình');
    }

    pool = new Pool({
      connectionString,
      // Supabase cần SSL cả local lẫn production
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

/**
 * Helper: dbQuery(text, params?) => res
 */
export async function dbQuery(text, params = []) {
  const db = getDb();
  const res = await db.query(text, params);
  return res;
}
