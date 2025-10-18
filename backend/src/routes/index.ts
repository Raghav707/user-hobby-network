// File: backend/src/routes/index.ts

import { Router } from 'express';

// 👇 Just add : Router right here 👇
const router: Router = Router();

// Test route for the API
router.get('/', (req, res) => {
  res.json({ message: 'API is alive!' });
});

// We will add other routes here later, like router.use('/users', ...)

export default router;