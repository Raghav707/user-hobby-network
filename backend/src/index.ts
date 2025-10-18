// File: backend/src/index.ts

import 'dotenv/config';
import express, { type Express } from 'express';
import apiRoutes from './routes/index.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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

// --- Swagger Docs Setup ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Hobby Network API',
      version: '1.0.0',
      description: 'API documentation for the Cybernauts Development Assignment',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ], // <--- Add comma here if needed
    // 👇 ADD THIS ENTIRE BLOCK 👇
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the user' },
            username: { type: 'string', description: 'User\'s unique name' },
            age: { type: 'integer', description: 'User\'s age' },
            hobbies: { type: 'array', items: { type: 'string' }, description: 'List of user\'s hobbies' },
            friends: { type: 'array', items: { type: 'string', format: 'uuid' }, description: 'List of friend user IDs' },
            createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the user was created' },
            popularityScore: { type: 'number', format: 'float', description: 'Calculated popularity score' }
          },
          required: ['id', 'username', 'age', 'hobbies', 'createdAt', 'friends', 'popularityScore']
        }
      }
    }
    // 👆 END OF BLOCK TO ADD 👆
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// --- Mount Swagger UI ---
// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Start the Server ---
// We only want to start the server (app.listen)
// if this file is run directly (pnpm dev),
// not when it's imported by a test file.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running beautifully at http://localhost:${PORT}`);
  });
}