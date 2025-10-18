// File: backend/src/index.ts

import 'dotenv/config'; // Loads .env file contents into process.env
import express from 'express';

// Create an Express application
const app = express();
app.use(express.json());

// Define the port, reading from the environment variable or defaulting to 3001
const PORT = process.env.PORT || 3001;

// A simple test route to make sure everything is working
app.get('/', (req, res) => {
  res.send('Hello from the backend! 👋');
});

// Start listening for requests on the specified port
app.listen(PORT, () => {
  console.log(`Server is running beautifully at http://localhost:${PORT}`);
});