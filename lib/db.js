// lib/db.js
import { Pool } from 'pg';

let pool = null;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const p = new Pool({
    connectionString,
    // Nếu Supabase yêu cầu SSL cứng, có thể bật:
    // ssl: { rejectUnauthorized: false },
  });

  // Rất quan trọng: không để lỗi pool làm crash Node
  p.on('error', (err) => {
    console.error('Postgres pool error (sẽ reconnect ở query tiếp theo):', err);
    // KHÔNG throw, KHÔNG process.exit()
    // Pool sẽ tạo connection mới khi cần.
  });

  return p;
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

// Hàm tiện dùng trực tiếp cho query
export async function dbQuery(text, params) {
  const p = getPool();
  return p.query(text, params);
}

// Hàm giữ tương thích với code cũ: await getDb() → db.query(...)
export async function getDb() {
  const p = getPool();
  return {
    query: (text, params) => p.query(text, params),
  };
}
