// File: backend/src/db.ts

import pg from 'pg';

// Create a new "Pool" of connections.
// This is the efficient way to manage database connections.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// We export a query function that will be used by our entire application
// It automatically handles getting a connection from the pool and releasing it.
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// We'll also export the pool itself in case we need it
export default pool;