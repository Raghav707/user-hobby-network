// File: backend/src/index.ts

import 'dotenv/config';
import express, { type Express } from 'express';
import apiRoutes from './routes/index.js';

// --- Create the App ---
// We export 'app' so we can use it in our test files
export const app: Express = express();

// --- Configure the App ---
app.use(express.json());

// Define the port
const PORT = process.env.PORT || 3001;

// --- Mount Routes ---
app.get('/', (req, res) => {
  res.send('Hello from the backend! 👋');
});

app.use('/api', apiRoutes);

// --- Start the Server ---
// We only want to start the server (app.listen)
// if this file is run directly (pnpm dev),
// not when it's imported by a test file.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running beautifully at http://localhost:${PORT}`);
  });
}