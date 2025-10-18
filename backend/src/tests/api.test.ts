// File: backend/src/tests/api.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js'; 
import pool from '../db.js';

// --- FIX #1: Top-level cleanup ---
// This will run only ONCE after ALL describe blocks in this file are done.
afterAll(async () => {
  await pool.end(); // Close the database connection safely at the very end.
});

// --- Test Suite for Basic Logic ---
describe('Basic CRUD and Friendship Logic', () => {
  let testUserA: any = null;
  let testUserB: any = null;

  beforeAll(async () => {
    await pool.query('DELETE FROM friendships');
    await pool.query('DELETE FROM users');
  });

  // This afterAll is now just for this specific suite's cleanup if needed,
  // but we REMOVED pool.end() from here.
  afterAll(async () => {
    await pool.query('DELETE FROM friendships');
    await pool.query('DELETE FROM users');
  });

  it('should create user A', async () => { /* ... no change ... */ 
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'TestUserA', age: 99, hobbies: ['testing'] });
    expect(res.statusCode).toBe(201);
    expect(res.body.username).toBe('TestUserA');
    testUserA = res.body;
  });

  it('should create user B', async () => { /* ... no change ... */
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'TestUserB', age: 98, hobbies: ['testing'] });
    expect(res.statusCode).toBe(201);
    expect(res.body.username).toBe('TestUserB');
    testUserB = res.body;
  });

  it('should link user A and user B', async () => {
    const res = await request(app)
      .post(`/api/users/${testUserA.id}/link`)
      .send({ friendId: testUserB.id });

    expect(res.statusCode).toBe(201);
    // --- FIX #2: Check for the NEW response structure ---
    expect(res.body.userA.id).toBe(testUserA.id); // Check for the userA object
    expect(res.body.userB.id).toBe(testUserB.id); // Check for the userB object
  });

  it('should FAIL to delete user A while they have a friend', async () => { /* ... no change ... */
    const res = await request(app).delete(`/api/users/${testUserA.id}`);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toContain('remove all friendships first');
  });

  it('should return the correct popularityScore after linking', async () => { /* ... no change ... */
    const res = await request(app).get(`/api/graph`);
    const userA = res.body.users.find((u: any) => u.id === testUserA.id);
    expect(res.statusCode).toBe(200);
    expect(userA.popularityScore).toBe(1.5);
  });

  it('should FAIL to link user B back to user A (already friends)', async () => { /* ... no change ... */
    const res = await request(app)
      .post(`/api/users/${testUserB.id}/link`)
      .send({ friendId: testUserA.id });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toContain('already friends');
  });

  it('should successfully delete user A after unlinking', async () => {
    const unlinkRes = await request(app)
      .delete(`/api/users/${testUserA.id}/unlink`)
      .send({ friendId: testUserB.id });

    // --- FIX #3: Expect a 200 OK now, not 204 ---
    expect(unlinkRes.statusCode).toBe(200); 
    expect(unlinkRes.body.userA.friends).toEqual([]); // Check that friends list is now empty

    const deleteRes = await request(app).delete(`/api/users/${testUserA.id}`);
    expect(deleteRes.statusCode).toBe(204);
  });
});

// --- Test Suite for Complex Score Calculation ---
describe('Popularity Score Calculation (Complex)', () => {
  // ... No changes needed in this entire block ...
  let userA_id: string, userB_id: string, userC_id: string;
  beforeAll(async () => {
    await pool.query('DELETE FROM friendships');
    await pool.query('DELETE FROM users');
    const resA = await request(app).post('/api/users').send({ username: 'ScoreUserA', age: 30, hobbies: ['1', '2', '3'] });
    const resB = await request(app).post('/api/users').send({ username: 'ScoreUserB', age: 31, hobbies: ['1', '2'] });
    const resC = await request(app).post('/api/users').send({ username: 'ScoreUserC', age: 32, hobbies: ['3', '4'] });
    userA_id = resA.body.id;
    userB_id = resB.body.id;
    userC_id = resC.body.id;
    await request(app).post(`/api/users/${userA_id}/link`).send({ friendId: userB_id });
    await request(app).post(`/api/users/${userA_id}/link`).send({ friendId: userC_id });
  });
  afterAll(async () => {
    await pool.query('DELETE FROM friendships');
    await pool.query('DELETE FROM users');
  });
  it('should calculate User A score correctly (2 friends, 3 shared hobbies)', async () => {
    const res = await request(app).get(`/api/graph`);
    const userA = res.body.users.find((u: any) => u.id === userA_id);
    expect(res.statusCode).toBe(200);
    expect(userA.popularityScore).toBe(3.5);
  });
  it('should calculate User B score correctly (1 friend, 2 shared hobbies)', async () => {
    const res = await request(app).get(`/api/graph`);
    const userB = res.body.users.find((u: any) => u.id === userB_id);
    expect(userB.popularityScore).toBe(2);
  });
  it('should calculate User C score correctly (1 friend, 1 shared hobby)', async () => {
    const res = await request(app).get(`/api/graph`);
    const userC = res.body.users.find((u: any) => u.id === userC_id);
    expect(userC.popularityScore).toBe(1.5);
  });
});