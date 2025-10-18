// File: backend/src/tests/api.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import 'dotenv/config';

// --- Import our app and database pool ---
// We need to slightly modify our index.ts to export the app for testing
// We'll do that in the *next* step. For now, this will have a red line.
import { app } from '../index.js'; 
import pool from '../db.js';

// Test Suite for API
describe('User API Endpoints', () => {
  let testUserA: any = null;
  let testUserB: any = null;

  // --- Helper: Clean up the database before we start ---
  beforeAll(async () => {
    await pool.query('DELETE FROM friendships');
    await pool.query('DELETE FROM users');
  });

  // --- Helper: Clean up after all tests are done ---
  afterAll(async () => {
    await pool.query('DELETE FROM friendships');
    await pool.query('DELETE FROM users');
    await pool.end(); // Close the database connection
  });

  // Test Case 1: Create our two test users
  it('should create user A', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'TestUserA', age: 99, hobbies: ['testing'] });

    expect(res.statusCode).toBe(201);
    expect(res.body.username).toBe('TestUserA');
    testUserA = res.body; // Save the user for other tests
  });

  it('should create user B', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ username: 'TestUserB', age: 98, hobbies: ['testing'] });

    expect(res.statusCode).toBe(201);
    expect(res.body.username).toBe('TestUserB');
    testUserB = res.body; // Save the user for other tests
  });

  // Test Case 2: Link the users
  it('should link user A and user B', async () => {
    const res = await request(app)
      .post(`/api/users/${testUserA.id}/link`)
      .send({ friendId: testUserB.id });

    expect(res.statusCode).toBe(201);
    expect(res.body.user_id_a).toBeDefined();
  });

  // Test Case 3 (CRITICAL): Deletion rule
  it('should FAIL to delete user A while they have a friend', async () => {
    const res = await request(app).delete(`/api/users/${testUserA.id}`);

    expect(res.statusCode).toBe(409); // 409 Conflict
    expect(res.body.message).toContain('remove all friendships first');
  });

  // Test Case 4 (CRITICAL): Popularity score calculation
    it('should return the correct popularityScore', async () => {
    // We know User A and B are friends. Let's check User A's score.
    // User A: 1 friend (User B), 1 shared hobby ('testing')
    // Score = 1 (friend) + (1 * 0.5) = 1.5
    const res = await request(app).get(`/api/users`);
    const userA = res.body.find((u: any) => u.id === testUserA.id);

    expect(res.statusCode).toBe(200);
    expect(userA.popularityScore).toBe(1.5);
    });

    // Test Case 5 (CRITICAL): Circular friendship prevention
    it('should FAIL to link user B back to user A (already friends)', async () => {
    // Try to create the *reverse* link
    const res = await request(app)
        .post(`/api/users/${testUserB.id}/link`) // Linking B to A
        .send({ friendId: testUserA.id });

    expect(res.statusCode).toBe(409); // 409 Conflict
    expect(res.body.message).toContain('already friends');
    });
});

