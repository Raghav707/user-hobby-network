// File: backend/src/controllers/userController.ts

import type { Request, Response } from 'express';
import { query } from '../db.js'; // 👈 1. IMPORT our query function

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getAllUsers = async (req: Request, res: Response) => {
  // 👇 2. ADD ASYNC and a try...catch block
  try {
    const result = await query('SELECT * FROM users');

    // 3. Send the actual users from the database
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// File: backend/src/controllers/userController.ts
// ... (keep the getAllUsers function above) ...

// @desc    Create a new user
// @route   POST /api/users
// @access  Public
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, age, hobbies } = req.body;

    // 1. A simple check to make sure we got the data
    if (!username || !age) {
      return res.status(400).json({ message: 'Please provide a username and age' });
    }

    // 2. This is our SQL command to insert a new user
    const sql = `
      INSERT INTO users (username, age, hobbies)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    // $1, $2, $3 are placeholders to prevent SQL injection (a security risk!)

    // 3. We run the query with our data
    const newUser = await query(sql, [username, age, hobbies || []]); // Use hobbies or an empty array

    // 4. Send back the newly created user from the database
    res.status(201).json(newUser.rows[0]);

  } catch (err: any) { // We can check for specific errors
    console.error(err);

    // This is a common error code for a "unique constraint violation"
    // (like if the username already exists)
    if (err.code === '23505') { 
      return res.status(409).json({ message: 'Username already exists' });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// File: backend/src/controllers/userController.ts
// ... (keep getAllUsers and createUser functions above) ...

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Public
export const updateUser = async (req: Request, res: Response) => {
  try {
    // 1. Get the ID from the URL
    const { id } = req.params;
    // 2. Get the new data from the body
    const { username, age, hobbies } = req.body;

    // 3. First, find the user to make sure they exist
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);

    if (!userResult.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingUser = userResult.rows[0];

    // 4. Create the new updated user object, using old values as a fallback
    const updatedUsername = username || existingUser.username;
    const updatedAge = age || existingUser.age;
    const updatedHobbies = hobbies || existingUser.hobbies;

    // 5. Run the UPDATE query
    const updateSql = `
      UPDATE users
      SET username = $1, age = $2, hobbies = $3
      WHERE id = $4
      RETURNING *;
    `;

    const updatedResult = await query(updateSql, [
      updatedUsername,
      updatedAge,
      updatedHobbies,
      id
    ]);

    // 6. Send back the fully updated user
    res.json(updatedResult.rows[0]);

  } catch (err: any) {
    console.error(err);

    // Check for "unique username" conflict
    if (err.code === '23505') { 
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Check for "invalid uuid" format
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
};



// File: backend/src/controllers/userController.ts
// ... (keep getAllUsers, createUser, and updateUser functions above) ...

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Public
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. BUSINESS LOGIC: Check if this user is in any friendships
    const friendshipCheckSql = `
      SELECT * FROM friendships
      WHERE user_id_a = $1 OR user_id_b = $1
      LIMIT 1;
    `;
    const friendshipResult = await query(friendshipCheckSql, [id]);

    // 2. If a friendship exists (rowCount > 0), block the deletion
    if (friendshipResult && friendshipResult.rowCount) {
      return res.status(409).json({
        message: 'Cannot delete user. Please remove all friendships first.'
      });
    }

    // 3. If no friendships, proceed with deletion
    const deleteSql = 'DELETE FROM users WHERE id = $1 RETURNING *;';
    const deleteResult = await query(deleteSql, [id]);

    // 4. Check if a user was actually found and deleted
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 5. Send a success response
    // 204 No Content is a standard, great response for a successful delete
    res.status(204).send();

  } catch (err: any) {
    console.error(err);

    // Check for "invalid uuid" format
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// File: backend/src/controllers/userController.ts
// ... (keep all other functions above) ...

// @desc    Create a friendship
// @route   POST /api/users/:id/link
// @access  Public
export const createFriendship = async (req: Request, res: Response) => {
  try {
    // 1. Get the ID of the first user from the URL params
    const { id: userIdA } = req.params;
    // 2. Get the ID of the second user from the request body
    const { friendId: userIdB } = req.body;

    // 3. Validation
    if (!userIdA) {
      return res.status(400).json({ message: 'User ID is required in the URL' });
    }
    if (!userIdB) {
      return res.status(400).json({ message: 'friendId is required in the body' });
    }
    if (userIdA === userIdB) {
      return res.status(400).json({ message: 'Cannot create friendship with oneself' });
    }

    // 4. BUSINESS LOGIC: Ensure user_id_a is always the smaller ID
    // This automatically handles the "Circular Friendship Prevention" 
    const idA = userIdA < userIdB ? userIdA : userIdB;
    const idB = userIdA < userIdB ? userIdB : userIdA;

    // 5. Run the INSERT query
    const sql = `
      INSERT INTO friendships (user_id_a, user_id_b)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const newFriendship = await query(sql, [idA, idB]);

    // 6. Send back the new friendship link
    res.status(201).json(newFriendship.rows[0]);

  } catch (err: any) {
    console.error(err);

    // Check for "unique constraint violation" (they are already friends)
    if (err.code === '23505') { 
      return res.status(409).json({ message: 'These users are already friends' });
    }

    // Check for "foreign key violation" (one of the user IDs doesn't exist)
    if (err.code === '23503') {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    // Check for "invalid uuid" format
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
};



// File: backend/src/controllers/userController.ts
// ... (keep all other functions above) ...

// @desc    Remove a friendship
// @route   DELETE /api/users/:id/unlink
// @access  Public
export const removeFriendship = async (req: Request, res: Response) => {
  try {
    // 1. Get the ID of the first user from the URL params
    const { id: userIdA } = req.params;
    // 2. Get the ID of the friend to unlink from the request body
    const { friendId: userIdB } = req.body;

    // 3. Validation
    if (!userIdA) {
      return res.status(400).json({ message: 'User ID is required in the URL' });
    }
    if (!userIdB) {
      return res.status(400).json({ message: 'friendId is required in the body' });
    }
    if (userIdA === userIdB) {
      return res.status(400).json({ message: 'Cannot remove friendship with oneself' });
    }

    // 4. BUSINESS LOGIC: Find the correct order of IDs
    const idA = userIdA < userIdB ? userIdA : userIdB;
    const idB = userIdA < userIdB ? userIdB : userIdA;

    // 5. Run the DELETE query
    const sql = `
      DELETE FROM friendships
      WHERE user_id_a = $1 AND user_id_b = $2
      RETURNING *;
    `;

    const deleteResult = await query(sql, [idA, idB]);

    // 6. Check if a friendship was actually found and deleted
    if (!deleteResult.rowCount) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    // 7. Send a 204 No Content success response
    res.status(204).send();

  } catch (err: any) {
    console.error(err);

    // Check for "invalid uuid" format
    if (err.code === '22P02') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    res.status(500).json({ message: 'Internal Server Error' });
  }
};