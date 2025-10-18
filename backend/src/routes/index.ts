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
/**
 * @openapi
 * /api/graph:
 *   get:
 *     tags:
 *       - Graph
 *     summary: Get data for graph visualization
 *     description: Retrieves all users (with calculated popularity scores and friends lists) and all friendship links, formatted for use with React Flow.
 *     responses:
 *       '200':
 *         description: An object containing arrays of users and friendships.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 friendships:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id_a:
 *                         type: string
 *                         format: uuid
 *                       user_id_b:
 *                         type: string
 *                         format: uuid
 *       '500':
 *         description: Internal Server Error
 */

router.get('/graph', getGraphData);

export default router;