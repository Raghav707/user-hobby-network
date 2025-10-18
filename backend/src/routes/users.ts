// File: backend/src/routes/users.ts

import { Router } from 'express';
// 👇 1. Import removeFriendship here
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  createFriendship,
  removeFriendship,
} from '../controllers/userController.js';

const userRouter: Router = Router();
/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Retrieves a list of all users, including their friends and calculated popularity scores.
 *     responses:
 *       '200':
 *         description: A list of user objects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       '500':
 *         description: Internal Server Error
 */

// GET /api/users
userRouter.get('/', getAllUsers);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     description: Adds a new user to the network.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: NewUser
 *               age:
 *                 type: integer
 *                 example: 30
 *               hobbies:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: ["reading", "gaming"]
 *             required:
 *               - username
 *               - age
 *     responses:
 *       '201':
 *         description: User created successfully. Returns the complete user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request (e.g., missing username or age)
 *       '409':
 *         description: Conflict (e.g., username already exists)
 *       '500':
 *         description: Internal Server Error
 */

// POST /api/users
userRouter.post('/', createUser);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update an existing user
 *     description: Updates a user's details (username, age, or hobbies). Requires the user ID in the URL path.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to update.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       description: User data to update. Only provide fields you want to change.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: UpdatedUser
 *               age:
 *                 type: integer
 *                 example: 31
 *               hobbies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["coding", "traveling"]
 *     responses:
 *       '200':
 *         description: User updated successfully. Returns the complete updated user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request (e.g., invalid ID format)
 *       '404':
 *         description: Not Found (User with the specified ID not found)
 *       '409':
 *         description: Conflict (e.g., updated username already exists)
 *       '500':
 *         description: Internal Server Error
 */

// PUT /api/users/:id
userRouter.put('/:id', updateUser);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user
 *     description: Deletes a user by their ID. Fails if the user still has active friendships.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to delete.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '204':
 *         description: User deleted successfully. No content returned.
 *       '400':
 *         description: Bad Request (e.g., invalid ID format)
 *       '404':
 *         description: Not Found (User with the specified ID not found)
 *       '409':
 *         description: Conflict (User cannot be deleted because they still have friendships)
 *       '500':
 *         description: Internal Server Error
 */

// DELETE /api/users/:id
userRouter.delete('/:id', deleteUser);

/**
 * @openapi
 * /api/users/{id}/link:
 *   post:
 *     tags:
 *       - Friendships
 *     summary: Create a friendship
 *     description: Creates a mutual friendship link between the user specified in the URL path (`id`) and the user specified in the request body (`friendId`).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the first user in the friendship.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       description: Specify the ID of the second user to link.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 format: uuid
 *                 example: "user-id-of-friend"
 *             required:
 *               - friendId
 *     responses:
 *       '201':
 *         description: Friendship created successfully. Returns the friendship record.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id_a:
 *                   type: string
 *                   format: uuid
 *                 user_id_b:
 *                   type: string
 *                   format: uuid
 *       '400':
 *         description: Bad Request (e.g., missing friendId, linking user to themself, invalid ID format)
 *       '404':
 *         description: Not Found (One or both user IDs do not exist)
 *       '409':
 *         description: Conflict (These users are already friends)
 *       '500':
 *         description: Internal Server Error
 */

// POST /api/users/:id/link
userRouter.post('/:id/link', createFriendship);

/**
 * @openapi
 * /api/users/{id}/unlink:
 *   delete:
 *     tags:
 *       - Friendships
 *     summary: Remove a friendship
 *     description: Removes the mutual friendship link between the user specified in the URL path (`id`) and the user specified in the request body (`friendId`).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the first user in the friendship.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       description: Specify the ID of the friend to unlink.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 format: uuid
 *                 example: "user-id-of-friend-to-unlink"
 *             required:
 *               - friendId
 *     responses:
 *       '204':
 *         description: Friendship removed successfully. No content returned.
 *       '400':
 *         description: Bad Request (e.g., missing friendId, unlinking user from themself, invalid ID format)
 *       '404':
 *         description: Not Found (Friendship between the specified users not found)
 *       '500':
 *         description: Internal Server Error
 */

// 👇 2. Add this line to handle DELETE /api/users/:id/unlink
userRouter.delete('/:id/unlink', removeFriendship);

export default userRouter;
