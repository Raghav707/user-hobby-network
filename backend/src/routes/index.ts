// File: backend/src/routes/index.ts

import { Router } from 'express';
import userRouter from './users.js';
import { getGraphData } from '../controllers/userController.js'; // 👈 1. IMPORT getGraphData

const router: Router = Router();

// Test route for the API
router.get('/', (req, res) => {
  res.json({ message: 'API is alive!' });
});

// Mount our user routes (e.g., /api/users, /api/users/:id/link)
router.use('/users', userRouter);

// 👇 2. ADD THIS LINE to handle GET /api/graph
router.get('/graph', getGraphData);

export default router;