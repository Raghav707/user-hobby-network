-- Enable UUID generator (pgcrypto recommended)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  age INT NOT NULL CHECK (age >= 0),
  hobbies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FRIENDSHIPS TABLE
-- We store mutual friendships once by enforcing user_id_a < user_id_b.
CREATE TABLE IF NOT EXISTS friendships (
  user_id_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT friendships_order CHECK (user_id_a < user_id_b),
  CONSTRAINT friendships_unique UNIQUE (user_id_a, user_id_b)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON friendships (user_id_a);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON friendships (user_id_b);
