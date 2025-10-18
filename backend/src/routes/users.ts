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

// GET /api/users
userRouter.get('/', getAllUsers);

// POST /api/users
userRouter.post('/', createUser);

// PUT /api/users/:id
userRouter.put('/:id', updateUser);

// DELETE /api/users/:id
userRouter.delete('/:id', deleteUser);

// POST /api/users/:id/link
userRouter.post('/:id/link', createFriendship);

// 👇 2. Add this line to handle DELETE /api/users/:id/unlink
userRouter.delete('/:id/unlink', removeFriendship);

export default userRouter;