// File: backend/src/db.ts

import pg, { type QueryResult } from 'pg'; // 👈 1. Import QueryResult here

// Create a new "Pool" of connections.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// We export a query function that will be used by our entire application
// It automatically handles getting a connection from the pool and releasing it.

// 👇 2. Add the explicit return type: Promise<QueryResult>
export const query = (
  text: string,
  params?: any[]
): Promise<QueryResult> => {
  return pool.query(text, params);
};

// We'll also export the pool itself in case we need it
export default pool;