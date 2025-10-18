// File: backend/src/routes/index.ts

import { Router } from 'express';
import userRouter from './users.js'; // 👈 1. ADD THIS IMPORT

const router: Router = Router();

// Test route for the API
router.get('/', (req, res) => {
  res.json({ message: 'API is alive!' });
});

// 👇 2. ADD THIS LINE to mount our user routes
router.use('/users', userRouter);

export default router;