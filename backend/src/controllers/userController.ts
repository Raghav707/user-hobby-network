// File: backend/src/controllers/userController.ts

import type { Request, Response } from 'express';
import { query } from '../db.js';
import {
  calculatePopularityScore,
  getFriendsForUser,
  calculateScoreForUser,
} from '../services/userService.js';

// File: backend/src/controllers/userController.ts

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all users and all friendships in parallel (it's faster!)
    const [usersResult, friendshipsResult] = await Promise.all([
      query(
        'SELECT id, username, age, hobbies, created_at AS "createdAt" FROM users ORDER BY "createdAt" ASC'
      ),
      query('SELECT * FROM friendships'),
    ]);

    const allUsers = usersResult.rows;
    const allFriendships = friendshipsResult.rows;

    // 2. Map over each user to add the full data
    const fullUsers = allUsers.map((user) => {
      // Get this user's friends
      const friendIds = allFriendships
        .filter((f) => f.user_id_a === user.id || f.user_id_b === user.id)
        .map((f) => (f.user_id_a === user.id ? f.user_id_b : f.user_id_a));

      // Calculate their score (re-using the logic from our graph endpoint)
      const popularityScore = calculatePopularityScore(
        user,
        allUsers,
        allFriendships
      );

      // 3. Return the complete user object
      return {
        ...user,
        friends: friendIds,
        popularityScore,
      };
    });

    res.json(fullUsers);

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
      return res
        .status(400)
        .json({ message: "Please provide a username and age" });
    }

    // 2. This is our SQL command to insert a new user
    const sql = `
      INSERT INTO users (username, age, hobbies)
      VALUES ($1, $2, $3)
      RETURNING id, username, age, hobbies, created_at AS "createdAt";
    `;
    // $1, $2, $3 are placeholders to prevent SQL injection (a security risk!)

    // 3. We run the query with our data
    const newUser = await query(sql, [username, age, hobbies || []]); // Use hobbies or an empty array

    // 4. Get the user data
    const createdUser = newUser.rows[0];

    // 5. Send back the complete user object, matching the PDF spec
    res.status(201).json({
      ...createdUser,
      friends: [], // A new user has no friends
      popularityScore: 0, // A new user has a score of 0
    });
  } catch (err: any) {
    // We can check for specific errors
    console.error(err);

    // This is a common error code for a "unique constraint violation"
    // (like if the username already exists)
    if (err.code === "23505") {
      return res.status(409).json({ message: "Username already exists" });
    }

    res.status(500).json({ message: "Internal Server Error" });
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
    const userResult = await query("SELECT * FROM users WHERE id = $1", [id]);

    if (!userResult.rowCount) {
      return res.status(404).json({ message: "User not found" });
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
      RETURNING id, username, age, hobbies, created_at AS "createdAt";
    `;

    const updatedResult = await query(updateSql, [
      updatedUsername,
      updatedAge,
      updatedHobbies,
      id,
    ]);

    // 6. Get the main updated user data
    const updatedUser = updatedResult.rows[0];

    // 7. Now, fetch the new friends and score for the complete response
    // We run these in parallel to be fast!
    const [friends, popularityScore] = await Promise.all([
      getFriendsForUser(updatedUser.id),
      calculateScoreForUser(updatedUser.id)
    ]);

    // 8. Send back the complete user object
    res.json({
      ...updatedUser,
      friends,
      popularityScore
    });
  } catch (err: any) {
    console.error(err);

    // Check for "unique username" conflict
    if (err.code === "23505") {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Check for "invalid uuid" format
    if (err.code === "22P02") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    res.status(500).json({ message: "Internal Server Error" });
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
        message: "Cannot delete user. Please remove all friendships first.",
      });
    }

    // 3. If no friendships, proceed with deletion
    const deleteSql = "DELETE FROM users WHERE id = $1 RETURNING *;";
    const deleteResult = await query(deleteSql, [id]);

    // 4. Check if a user was actually found and deleted
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5. Send a success response
    // 204 No Content is a standard, great response for a successful delete
    res.status(204).send();
  } catch (err: any) {
    console.error(err);

    // Check for "invalid uuid" format
    if (err.code === "22P02") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    res.status(500).json({ message: "Internal Server Error" });
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
      return res
        .status(400)
        .json({ message: "User ID is required in the URL" });
    }
    if (!userIdB) {
      return res
        .status(400)
        .json({ message: "friendId is required in the body" });
    }
    if (userIdA === userIdB) {
      return res
        .status(400)
        .json({ message: "Cannot create friendship with oneself" });
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

    // 6. Friendship created! Now fetch the updated data for both users

    // Use Promise.all to fetch both users and their scores/friends efficiently
    const [userAData, userBData, scoreA, scoreB, friendsA, friendsB] = await Promise.all([
        query('SELECT id, username, age, hobbies, created_at AS "createdAt" FROM users WHERE id = $1', [userIdA]), // Use original userIdA
        query('SELECT id, username, age, hobbies, created_at AS "createdAt" FROM users WHERE id = $1', [userIdB]), // Use original userIdB
        calculateScoreForUser(userIdA), // Calculate score for user A
        calculateScoreForUser(userIdB), // Calculate score for user B
        getFriendsForUser(userIdA),     // Get friends for user A
        getFriendsForUser(userIdB)      // Get friends for user B
    ]);

    // Check if users were found (should not happen if friendship was created, but good practice)
    if (!userAData.rowCount || !userBData.rowCount) {
        return res.status(404).json({ message: 'One or both users not found after creating friendship.' });
    }

    const userA = { ...userAData.rows[0], popularityScore: scoreA, friends: friendsA };
    const userB = { ...userBData.rows[0], popularityScore: scoreB, friends: friendsB };

    // 7. Send back both updated user objects
    res.status(201).json({ userA, userB });
  } catch (err: any) {
    console.error(err);

    // Check for "unique constraint violation" (they are already friends)
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ message: "These users are already friends" });
    }

    // Check for "foreign key violation" (one of the user IDs doesn't exist)
    if (err.code === "23503") {
      return res.status(404).json({ message: "One or both users not found" });
    }

    // Check for "invalid uuid" format
    if (err.code === "22P02") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    res.status(500).json({ message: "Internal Server Error" });
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
      return res
        .status(400)
        .json({ message: "User ID is required in the URL" });
    }
    if (!userIdB) {
      return res
        .status(400)
        .json({ message: "friendId is required in the body" });
    }
    if (userIdA === userIdB) {
      return res
        .status(400)
        .json({ message: "Cannot remove friendship with oneself" });
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
      return res.status(404).json({ message: "Friendship not found" });
    }

    // --- Keep the code above this line ---

    // 7. Friendship removed! Now fetch the updated data for both users

    // Use Promise.all to fetch both users and their scores/friends efficiently
    const [userAData, userBData, scoreA, scoreB, friendsA, friendsB] = await Promise.all([
        query('SELECT id, username, age, hobbies, created_at AS "createdAt" FROM users WHERE id = $1', [userIdA]), // Use original userIdA from params
        query('SELECT id, username, age, hobbies, created_at AS "createdAt" FROM users WHERE id = $1', [userIdB]), // Use original userIdB from body
        calculateScoreForUser(userIdA), // Recalculate score for user A
        calculateScoreForUser(userIdB), // Recalculate score for user B
        getFriendsForUser(userIdA),     // Get new friends for user A
        getFriendsForUser(userIdB)      // Get new friends for user B
    ]);

    // Check if users were found (should not happen if friendship existed, but good practice)
    if (!userAData.rowCount || !userBData.rowCount) {
        // If users don't exist, maybe send 204 since the link is gone anyway, or handle as error
         console.error("User not found after removing friendship, this shouldn't happen.");
         // Sending 204 as the link is indeed removed.
         return res.status(204).send(); 
    }

    const userA = { ...userAData.rows[0], popularityScore: scoreA, friends: friendsA };
    const userB = { ...userBData.rows[0], popularityScore: scoreB, friends: friendsB };

    // 8. Send back both updated user objects with status 200 OK
    res.status(200).json({ userA, userB });
  } catch (err: any) {
    console.error(err);

    // Check for "invalid uuid" format
    if (err.code === "22P02") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

// File: backend/src/controllers/userController.ts
// ... (keep all other functions above) ...

// Helper function to calculate the popularity score
// Logic: number of unique friends + (total hobbies shared with friends * 0.5)

// @desc    Get all users and friendship data for graph visualization
// @route   GET /api/graph
// @access  Public
export const getGraphData = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all users
    const usersResult = await query(
      'SELECT id, username, age, hobbies, created_at AS "createdAt" FROM users ORDER BY "createdAt" ASC'
    );
    const allUsers = usersResult.rows;

    // 2. Fetch all friendships
    const friendshipsResult = await query("SELECT * FROM friendships");
    const allFriendships = friendshipsResult.rows;

    // 3. Calculate popularity score for each user
    const usersWithScores = allUsers.map((user) => {
      const popularityScore = calculatePopularityScore(
        user,
        allUsers,
        allFriendships
      );

      // 4. Also attach a simple list of friends (their IDs) for the graph
      const friendIds = allFriendships
        .filter((f) => f.user_id_a === user.id || f.user_id_b === user.id)
        .map((f) => (f.user_id_a === user.id ? f.user_id_b : f.user_id_a));

      return {
        ...user,
        popularityScore,
        friends: friendIds,
      };
    });

    // 5. Send back the combined data
    res.json({
      users: usersWithScores,
      friendships: allFriendships,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
