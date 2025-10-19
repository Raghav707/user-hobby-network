-- Optional: clean tables for a fresh demo
TRUNCATE friendships RESTART IDENTITY;
TRUNCATE users RESTART IDENTITY;

-- Insert 3 demo users
INSERT INTO users (id, username, age, hobbies)
VALUES
  (gen_random_uuid(), 'Alice', 30, '["reading","music"]'::jsonb),
  (gen_random_uuid(), 'Bob',   28, '["music","gym"]'::jsonb),
  (gen_random_uuid(), 'Charlie', 35, '["chess","reading"]'::jsonb);

-- Link Alice–Bob (we must insert ordered by UUID: user_id_a < user_id_b)
-- We’ll compute ordered ids in SQL:

WITH
  a AS (SELECT id FROM users WHERE username='Alice' LIMIT 1),
  b AS (SELECT id FROM users WHERE username='Bob'   LIMIT 1),
  ord AS (
    SELECT LEAST(a.id, b.id) AS id_a, GREATEST(a.id, b.id) AS id_b
    FROM a, b
  )
INSERT INTO friendships (user_id_a, user_id_b)
SELECT id_a, id_b FROM ord
ON CONFLICT DO NOTHING;
