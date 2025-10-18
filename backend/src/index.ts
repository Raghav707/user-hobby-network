// File: backend/src/index.ts

import 'dotenv/config';
import express from 'express';
import apiRoutes from './routes/index.js'; // 👈 1. ADD THIS IMPORT

// Create an Express application
const app = express();
app.use(express.json());

// Define the port
const PORT = process.env.PORT || 3001;

// A simple test route to make sure everything is working
app.get('/', (req, res) => {
  res.send('Hello from the backend! 👋');
});

// 👇 2. ADD THIS LINE to mount our API routes
app.use('/api', apiRoutes);

// Start listening for requests
app.listen(PORT, () => {
  console.log(`Server is running beautifully at http://localhost:${PORT}`);
});