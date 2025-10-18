// File: backend/init-db.ts

import 'dotenv/config';
import pool from './src/db.js'; // Note the '.js' extension for ES Modules

const createTables = async () => {
  console.log('Attempting to create tables...');
  try {
    await pool.query(`
      -- 1. Create the Users Table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) NOT NULL UNIQUE,
        age INT NOT NULL,
        hobbies TEXT[] DEFAULT ARRAY[]::TEXT[], -- Using a text array for hobbies
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Create the Friendships Table (for many-to-many)
      CREATE TABLE IF NOT EXISTS friendships (
        user_id_a UUID REFERENCES users(id) ON DELETE CASCADE,
        user_id_b UUID REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id_a, user_id_b),
        -- This CHECK ensures we don't have (A, B) and (B, A) duplicates
        CHECK (user_id_a < user_id_b) 
      );

      -- 3. Create an index for faster lookups on friendships
      CREATE INDEX IF NOT EXISTS idx_friendships_b ON friendships(user_id_b);
    `);

    console.log('✅ Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    // End the pool connection so the script can exit
    await pool.end();
  }
};

createTables();