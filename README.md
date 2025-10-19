# User Relationship & Hobby Network

This is a full-stack application built for the Cybernauts Development Assignment. It manages users and their relationships, visualised as a dynamic graph.

## Features

- **Backend:** Node.js (Express), TypeScript, and PostgreSQL.
- **Frontend:** React, TypeScript, Vite, and React Flow.
- **Full CRUD API** for users and hobbies.
- **Friendship Management:** API endpoints for linking and unlinking users.
- **Live Graph:** Dynamic graph visualization using React Flow.
- **Live Popularity Score:** Nodes update to reflect a user's popularity score.
- **Interactive UI:** Drag-and-drop hobbies, connect users by dragging nodes.
- **Bonus Feature:** Undo/Redo for node positions.
- **Bonus Feature:** Custom `HighScoreNode` and `LowScoreNode` types.

---

## Live Demo & API

- **Live Frontend (Vercel):** [https://user-hobby-network.vercel.app](https://user-hobby-network.vercel.app)
- **Live Backend (Render):** [https://user-hobby-network.onrender.com](https://user-hobby-network.onrender.com)
- **Live API Docs (Swagger):** [https://user-hobby-network.onrender.com/api-docs](https://user-hobby-network.onrender.com/api-docs)

---

## Setup & Installation

### 1. Backend (`/backend`)

1.  Navigate to the `backend` directory: `cd backend`
2.  Create a `.env` file (see `.env.example`).
3.  Add your PostgreSQL `DATABASE_URL`.
4.  Install dependencies: `pnpm install`
5.  Run the database schema: `psql -U your_user -d your_db -f sql/schema.sql`
6.  (Optional) Run the seed script: `psql -U your_user -d your_db -f sql/seed.sql`
7.  Start the development server: `pnpm dev`

### 2. Frontend (`/frontend`)

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Create a `.env` file (see `.env.example`).
3.  Set `VITE_API_URL` to your backend's URL (e.g., `http://localhost:3001`).
4.  Install dependencies: `pnpm install`
5.  Start the development server: `pnpm dev`